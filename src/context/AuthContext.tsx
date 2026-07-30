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

const ENDPOINTS = [
  'https://cloud.appwrite.io/v1',
  'https://fra.cloud.appwrite.io/v1',
];
const APPWRITE_PROJECT_ID = '69c58725000ef2b43f18';

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

function extractSessionSecret(rawSecret: string): string {
  if (!rawSecret) return '';
  if (rawSecret.includes('.')) {
    try {
      const parts = rawSecret.split('.');
      if (parts.length >= 2) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const payloadStr = atob(base64);
        const payload = JSON.parse(payloadStr);
        if (payload && payload.secret) {
          return String(payload.secret);
        }
      }
    } catch (e) {
      console.warn('[Auth] Failed to parse JWT secret:', e);
    }
  }
  return rawSecret;
}

function cleanTokenFromUrl() {
  if (typeof window === 'undefined') return;
  const clean = new URL(window.location.href);
  clean.searchParams.delete('secret');
  clean.searchParams.delete('userId');
  clean.searchParams.delete('user_id');
  window.history.replaceState({}, '', clean.toString());
}

/**
 * Direct fetch to Appwrite /account/sessions/token using credentials: 'omit'.
 * Tries both cloud.appwrite.io and fra.cloud.appwrite.io for network resilience.
 */
async function directCreateSession(userId: string, secret: string): Promise<any> {
  let lastErr: any = null;
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(`${ep}/account/sessions/token`, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        },
        body: JSON.stringify({ userId, secret }),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed.message || parsed.type || text;
        } catch {}
        throw new Error(`[${res.status} ${ep}] ${msg}`);
      }

      return JSON.parse(text);
    } catch (err: any) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All Appwrite endpoints failed for createSession');
}

/**
 * Direct fetch to Appwrite /account using X-Appwrite-Session header and credentials: 'omit'.
 */
async function directGetAccount(sessionSecret: string): Promise<any> {
  let lastErr: any = null;
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(`${ep}/account`, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          'X-Appwrite-Session': sessionSecret,
        },
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed.message || parsed.type || text;
        } catch {}
        throw new Error(`[${res.status} ${ep}] ${msg}`);
      }

      return JSON.parse(text);
    } catch (err: any) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All Appwrite endpoints failed for getAccount');
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
   */
  const exchangeOAuthToken = useCallback(async (): Promise<OAuthExchangeResult> => {
    setIsLoading(true);
    try {
      const token = getTokenFromUrl();

      if (!token) {
        // No URL params — check if user already has an active session saved
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
          detail: `No OAuth parameters in URL (search: "${window.location.search}")`,
        };
      }

      // Step 1: Exchange the one-time OAuth token for a session
      let session: any = null;
      let errDetail = '';

      // Try 1A: Direct fetch with raw token string
      try {
        session = await directCreateSession(token.userId, token.secret);
      } catch (e1: any) {
        errDetail = String(e1?.message || e1);

        // Try 1B: Direct fetch with extracted JWT secret if token is a JWT
        const cleanSecret = extractSessionSecret(token.secret);
        if (cleanSecret && cleanSecret !== token.secret) {
          try {
            session = await directCreateSession(token.userId, cleanSecret);
          } catch (e2: any) {
            errDetail += ` | jwt_err: ${e2?.message || e2}`;
          }
        }

        // Try 1C: SDK fallback
        if (!session) {
          try {
            session = await account.createSession(token.userId, token.secret);
          } catch (e3: any) {
            errDetail += ` | sdk_err: ${e3?.message || e3}`;
          }
        }
      }

      if (!session) {
        return {
          ok: false,
          reason: 'create_session_failed',
          detail: errDetail || 'Appwrite createSession returned empty session',
        };
      }

      // Step 2: Persist the session secret (sets X-Appwrite-Session header & saves to localStorage)
      const sessionSecret = session.secret || extractSessionSecret(token.secret) || token.secret;
      persistSession(sessionSecret);

      // Step 3: Clean token params from URL bar
      cleanTokenFromUrl();

      // Step 4: Load user profile with session fallback
      let rawUser: any = null;
      try {
        rawUser = await directGetAccount(sessionSecret);
      } catch {
        try {
          rawUser = await account.get();
        } catch {}
      }

      const resolvedUserId = String(rawUser?.$id || session.userId || session.$id || token.userId);
      const plan = await loadPlan(resolvedUserId);

      const resolvedUser: AuthUser = rawUser
        ? toAuthUser(rawUser, plan)
        : {
            id: resolvedUserId,
            name: String(session.userName || session.name || session.userEmail || session.email || 'User'),
            email: String(session.userEmail || session.email || ''),
            emailVerification: true,
            plan,
          };

      setUserRef.current(resolvedUser);
      return { ok: true, user: resolvedUser };
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
