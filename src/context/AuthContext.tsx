import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ID, OAuthProvider, Query } from 'appwrite';
import { account, DATABASE_ID, databases } from '../lib/qofeno-appwrite';

export type AuthPlan = 'free' | 'pro' | 'teams';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerification?: boolean;
  plan: AuthPlan;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Never throws. Returns null when no active session. */
  refreshSession: () => Promise<AuthUser | null>;
  /**
   * Called only from AuthCallback after an OAuth redirect.
   * Exchanges the one-time ?userId+secret from the URL into a
   * real session, then loads the user. Returns null on failure.
   */
  exchangeOAuthToken: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  /** Triggers a full-page redirect — nothing after this runs. */
  createOAuthSession: (provider: 'google' | 'github', redirect?: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadPlan(userId: string): Promise<AuthPlan> {
  try {
    const docs = await databases.listDocuments(DATABASE_ID, 'users_meta', [
      Query.equal('user_id', userId),
      Query.limit(1),
    ]);
    const plan = String(docs.documents?.[0]?.plan || 'free').toLowerCase();
    if (plan === 'pro') return 'pro';
    if (plan === 'teams') return 'teams';
    return 'free';
  } catch {
    return 'free';
  }
}

function toAuthUser(raw: any, plan: AuthPlan): AuthUser {
  return {
    id: String(raw.$id),
    name: String(raw.name || raw.email || 'User'),
    email: String(raw.email || ''),
    emailVerification: Boolean(raw.emailVerification),
    plan,
  };
}

/** Extract ?userId and ?secret from the current URL (set by Appwrite after createOAuth2Token). */
function getTokenFromUrl(): { userId: string; secret: string } | null {
  if (typeof window === 'undefined') return null;
  const sp = new URLSearchParams(window.location.search);
  const hp = window.location.hash.includes('=')
    ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
    : new URLSearchParams();

  const secret = sp.get('secret') || hp.get('secret');
  const userId  = sp.get('userId')  || sp.get('user_id')  || hp.get('userId')  || hp.get('user_id');
  if (!secret || !userId) return null;
  return { userId, secret };
}

/** Remove one-time token params from the URL bar (prevents replay on refresh). */
function cleanTokenFromUrl() {
  if (typeof window === 'undefined') return;
  const clean = new URL(window.location.href);
  clean.searchParams.delete('secret');
  clean.searchParams.delete('userId');
  clean.searchParams.delete('user_id');
  window.history.replaceState({}, '', clean.toString());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;

  /** Load the currently signed-in user from Appwrite (no token exchange). */
  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    setIsLoading(true);
    try {
      const raw  = await account.get();
      const plan = await loadPlan(raw.$id);
      const resolved = toAuthUser(raw, plan);
      setUserRef.current(resolved);
      return resolved;
    } catch {
      setUserRef.current(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Called exclusively from AuthCallback.
   * Reads ?userId+?secret from the URL (put there by Appwrite after createOAuth2Token),
   * exchanges them for a session via account.createSession(), then calls account.get().
   *
   * Separation from refreshSession prevents the race condition where AuthContext's
   * own initial refreshSession() consumes the one-time token before AuthCallback does.
   */
  const exchangeOAuthToken = useCallback(async (): Promise<AuthUser | null> => {
    setIsLoading(true);
    try {
      const token = getTokenFromUrl();
      if (token) {
        // Exchange the one-time token for a persistent session.
        // This stores the session in localStorage (cookieFallback) via the SDK,
        // so subsequent account.get() calls work cross-domain.
        await account.createSession(token.userId, token.secret);
        cleanTokenFromUrl();
      }
      // Whether or not we had a token, try to load the user.
      // (For email/password or existing session flows landing on /auth/callback)
      const raw  = await account.get();
      const plan = await loadPlan(raw.$id);
      const resolved = toAuthUser(raw, plan);
      setUserRef.current(resolved);
      return resolved;
    } catch (err) {
      console.warn('[Auth] exchangeOAuthToken failed:', err);
      setUserRef.current(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial session restore on app load (no token exchange — just account.get())
  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password);
    await refreshSession();
  }, [refreshSession]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    try {
      await account.createVerification(`${window.location.origin}/auth/callback?redirect=/profile`);
    } catch (e) {
      console.warn('[Auth] Verification email skipped (non-fatal):', e);
    }
    await refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch (e) {
      console.warn('[Auth] Logout error (non-fatal):', e);
    } finally {
      setUserRef.current(null);
      setIsLoading(false);
    }
  }, []);

  const sendPasswordRecovery = useCallback(async (email: string) => {
    await account.createRecovery(email, `${window.location.origin}/reset-password`);
  }, []);

  /**
   * Use createOAuth2Token (not createOAuth2Session) so that Appwrite appends
   * ?userId and ?secret to the success URL instead of relying on a cross-domain
   * cookie that modern browsers block (Chrome 115+, Safari, Firefox).
   */
  const createOAuthSession = useCallback((provider: 'google' | 'github', redirect = '/profile') => {
    const success = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    const failure = `${window.location.origin}/login?error=oauth&redirect=${encodeURIComponent(redirect)}`;
    const oauthProvider = provider === 'google' ? OAuthProvider.Google : OAuthProvider.Github;
    // Synchronous redirect — nothing after this executes
    account.createOAuth2Token(oauthProvider, success, failure);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    refreshSession,
    exchangeOAuthToken,
    login,
    signup,
    logout,
    sendPasswordRecovery,
    createOAuthSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
