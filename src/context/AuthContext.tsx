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
  /** Returns the resolved user (or null if no session). Never throws. */
  refreshSession: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
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

/**
 * Try to exchange a one-time OAuth/verification token from URL params.
 *
 * When using createOAuth2Token (the cross-domain safe method), Appwrite
 * appends `userId` and `secret` to the success URL query string.
 * We must call account.createSession(userId, secret) to finalise the
 * session before account.get() will work.
 *
 * Returns true if a session was created from URL params.
 */
async function tryCreateSessionFromUrl(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const sp = new URLSearchParams(window.location.search);
  // Also check hash params (some Appwrite versions use hash)
  let hp = new URLSearchParams();
  if (window.location.hash && window.location.hash.includes('=')) {
    hp = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  }

  const secret = sp.get('secret') || hp.get('secret');
  const userId  = sp.get('userId')  || sp.get('user_id')  || hp.get('userId')  || hp.get('user_id');

  if (!secret || !userId) return false;

  try {
    await account.createSession(userId, secret);
    // Clean up the URL so the token can't be replayed on the next refresh
    const clean = new URL(window.location.href);
    clean.searchParams.delete('secret');
    clean.searchParams.delete('userId');
    clean.searchParams.delete('user_id');
    window.history.replaceState({}, '', clean.toString());
    return true;
  } catch (err) {
    console.warn('[Auth] createSession from URL token failed:', err);
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stable ref to setUser — avoids stale closure in useCallback with [] deps
  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    setIsLoading(true);
    try {
      // Exchange OAuth/verification URL token → session (cross-domain safe)
      await tryCreateSessionFromUrl();

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

  // Run once on mount to restore an existing session
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
      // Non-fatal — only works if SMTP is configured in Appwrite
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
   * Initiate OAuth sign-in via the TOKEN flow (createOAuth2Token).
   *
   * IMPORTANT: We use createOAuth2Token instead of createOAuth2Session
   * because the site (qofeno-labs.pages.dev) and the Appwrite endpoint
   * (fra.cloud.appwrite.io) are on different domains. Modern browsers
   * (Chrome 115+, Safari, Firefox) block cross-origin cookies by default,
   * which breaks createOAuth2Session completely.
   *
   * createOAuth2Token appends `userId` and `secret` to the success URL.
   * AuthCallback calls refreshSession() which calls tryCreateSessionFromUrl()
   * to exchange those for a real session stored in localStorage.
   */
  const createOAuthSession = useCallback((provider: 'google' | 'github', redirect = '/profile') => {
    const success = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    const failure = `${window.location.origin}/login?error=oauth&redirect=${encodeURIComponent(redirect)}`;
    const oauthProvider = provider === 'google' ? OAuthProvider.Google : OAuthProvider.Github;
    // This synchronously redirects the browser — nothing after runs
    account.createOAuth2Token(oauthProvider, success, failure);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    refreshSession,
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
