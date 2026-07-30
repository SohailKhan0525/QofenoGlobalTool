import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ID, OAuthProvider, Query } from 'appwrite';
import { account, DATABASE_ID, databases, persistSession, clearPersistedSession } from '../lib/qofeno-appwrite';

export type AuthPlan = 'free' | 'pro' | 'teams';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerification?: boolean;
  plan: AuthPlan;
};

export type OAuthExchangeResult =
  | { ok: true;  user: AuthUser }
  | { ok: false; reason: 'no_token' | 'create_session_failed' | 'get_account_failed'; detail: string };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<AuthUser | null>;
  exchangeOAuthToken: () => Promise<OAuthExchangeResult>;
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

function getTokenFromUrl(): { userId: string; secret: string } | null {
  if (typeof window === 'undefined') return null;
  const sp = new URLSearchParams(window.location.search);
  const hp = window.location.hash.includes('=')
    ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
    : new URLSearchParams();
  const secret = sp.get('secret') || hp.get('secret');
  const userId  = sp.get('userId') || sp.get('user_id') || hp.get('userId') || hp.get('user_id');
  if (!secret || !userId) return null;
  return { userId, secret };
}

function cleanTokenFromUrl() {
  if (typeof window === 'undefined') return;
  const clean = new URL(window.location.href);
  clean.searchParams.delete('secret');
  clean.searchParams.delete('userId');
  clean.searchParams.delete('user_id');
  window.history.replaceState({}, '', clean.toString());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;

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
   * Called exclusively from AuthCallback after an OAuth redirect.
   *
   * Flow:
   * 1. Read ?userId + ?secret from URL (appended by Appwrite after createOAuth2Token)
   * 2. Call account.createSession(userId, secret) → Appwrite creates a real session
   * 3. Call persistSession(session.secret) → stores the session secret in localStorage
   *    AND sets client.setSession(secret) so every subsequent SDK call includes
   *    X-Appwrite-Session header. This bypasses third-party cookies AND X-Fallback-Cookies.
   * 4. Call account.get() to confirm the session works
   */
  const exchangeOAuthToken = useCallback(async (): Promise<OAuthExchangeResult> => {
    setIsLoading(true);
    try {
      const token = getTokenFromUrl();

      if (!token) {
        // No URL params — maybe the user already has an active session (e.g. email login redirect)
        try {
          const raw  = await account.get();
          const plan = await loadPlan(raw.$id);
          const resolved = toAuthUser(raw, plan);
          setUserRef.current(resolved);
          return { ok: true, user: resolved };
        } catch {}
        return {
          ok: false,
          reason: 'no_token',
          detail: `URL search: "${window.location.search}" | hash: "${window.location.hash}"`,
        };
      }

      // Exchange the one-time token for a real session
      let session: any;
      try {
        session = await account.createSession(token.userId, token.secret);
      } catch (e: any) {
        console.error('[Auth] createSession failed:', e);
        return {
          ok: false,
          reason: 'create_session_failed',
          detail: String(e?.message || e || 'Unknown error from createSession'),
        };
      }

      // ── The critical fix ────────────────────────────────────────────────────
      // After createSession, Appwrite returns a Session object with a `secret`
      // field. We persist this to localStorage AND call client.setSession() so
      // every subsequent SDK call sends X-Appwrite-Session header directly.
      // This completely bypasses the need for third-party cookies or the
      // X-Fallback-Cookies header mechanism.
      const sessionSecret = session?.secret || token.secret;
      persistSession(sessionSecret);
      cleanTokenFromUrl();
      // ────────────────────────────────────────────────────────────────────────

      // Confirm the session works
      try {
        const raw  = await account.get();
        const plan = await loadPlan(raw.$id);
        const resolved = toAuthUser(raw, plan);
        setUserRef.current(resolved);
        return { ok: true, user: resolved };
      } catch (e: any) {
        return {
          ok: false,
          reason: 'get_account_failed',
          detail: String(e?.message || e || 'Unknown error from account.get()'),
        };
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await account.createEmailPasswordSession(email, password);
    persistSession(session.secret);
    await refreshSession();
  }, [refreshSession]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await account.create(ID.unique(), email, password, name);
    const session = await account.createEmailPasswordSession(email, password);
    persistSession(session.secret);
    try {
      await account.createVerification(`${window.location.origin}/auth/callback?redirect=/profile`);
    } catch (e) {
      console.warn('[Auth] Verification email skipped (non-fatal):', e);
    }
    await refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try { await account.deleteSession('current'); } catch {}
    clearPersistedSession();
    setUserRef.current(null);
    setIsLoading(false);
  }, []);

  const sendPasswordRecovery = useCallback(async (email: string) => {
    await account.createRecovery(email, `${window.location.origin}/reset-password`);
  }, []);

  const createOAuthSession = useCallback((provider: 'google' | 'github', redirect = '/profile') => {
    const success = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    const failure = `${window.location.origin}/login?error=oauth&redirect=${encodeURIComponent(redirect)}`;
    const oauthProvider = provider === 'google' ? OAuthProvider.Google : OAuthProvider.Github;
    account.createOAuth2Token(oauthProvider, success, failure);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: Boolean(user), isLoading,
      refreshSession, exchangeOAuthToken,
      login, signup, logout, sendPasswordRecovery, createOAuthSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
