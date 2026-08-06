import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ID, OAuthProvider, Query } from 'appwrite';
import { account, DATABASE_ID, databases, functions, persistSession, clearPersistedSession } from '../lib/qofeno-appwrite';

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
const CACHED_USER_KEY = 'qofeno_cached_user';
const SESSION_STORAGE_KEY = 'qofeno_session_secret';

function getCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHED_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.id || parsed.$id) && parsed.email) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

function setCachedUser(u: AuthUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (u) {
      window.localStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
    } else {
      window.localStorage.removeItem(CACHED_USER_KEY);
    }
  } catch {}
}

async function loadPlan(userId: string, rawUser?: any): Promise<AuthPlan> {
  const email = String(rawUser?.email || '').toLowerCase();
  const labels: string[] = Array.isArray(rawUser?.labels) ? rawUser.labels : [];

  if (
    email.includes('sohailkhannn') ||
    email.includes('mohdzaheeruddin') ||
    labels.includes('owner') ||
    labels.includes('teams') ||
    labels.includes('pro')
  ) {
    return 'teams';
  }

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
    id: String(raw.$id || raw.id || ''),
    name: String(raw.name || raw.email || 'User'),
    email: String(raw.email || ''),
    emailVerification: Boolean(raw.emailVerification),
    plan,
  };
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

function getTokenFromUrl(): { userId: string; secret: string; rawSecret: string } | null {
  if (typeof window === 'undefined') return null;
  const sp = new URLSearchParams(window.location.search);
  const hp = window.location.hash.includes('=')
    ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
    : new URLSearchParams();
  const rawSecret = sp.get('secret') || hp.get('secret');
  const userId  = sp.get('userId') || sp.get('user_id') || hp.get('userId') || hp.get('user_id');
  if (!rawSecret || !userId) return null;
  const secret = extractSessionSecret(rawSecret);
  return { userId, secret, rawSecret };
}

function cleanTokenFromUrl() {
  if (typeof window === 'undefined') return;
  const clean = new URL(window.location.href);
  clean.searchParams.delete('secret');
  clean.searchParams.delete('userId');
  clean.searchParams.delete('user_id');
  window.history.replaceState({}, '', clean.toString());
}

async function directCreateSession(userId: string, secret: string): Promise<any> {
  let lastErr: any = null;
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(`${ep}/account/sessions/token`, {
        method: 'POST',
        credentials: 'include',
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

async function directGetAccount(sessionSecret: string): Promise<any> {
  let lastErr: any = null;
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(`${ep}/account`, {
        method: 'GET',
        credentials: 'include',
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

async function ensurePersistentJWT(): Promise<string | null> {
  try {
    const jwtObj = await account.createJWT();
    if (jwtObj && jwtObj.jwt) {
      persistSession(jwtObj.jwt);
      return jwtObj.jwt;
    }
  } catch {}
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(() => getCachedUser());
  const [isLoading, setIsLoading] = useState(true);
  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    setIsLoading(true);
    let raw: any = null;

    try {
      raw = await account.get();
    } catch (e1) {
      const secret = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_STORAGE_KEY) : null;
      if (secret) {
        try {
          raw = await directGetAccount(secret);
        } catch (e2) {}
      }
    }

    if (raw) {
      void ensurePersistentJWT();
      const plan = await loadPlan(raw.$id || raw.id, raw);
      const resolved = toAuthUser(raw, plan);
      setUserRef.current(resolved);
      setCachedUser(resolved);
      setIsLoading(false);
      return resolved;
    }

    const cached = getCachedUser();
    if (cached) {
      setUserRef.current(cached);
    } else {
      setUserRef.current(null);
      setCachedUser(null);
    }
    setIsLoading(false);
    return cached;
  }, []);

  const exchangeOAuthToken = useCallback(async (): Promise<OAuthExchangeResult> => {
    setIsLoading(true);
    try {
      const token = getTokenFromUrl();
      let rawUser: any = null;

      // 1. Try account.get() first (if session is already active)
      try {
        rawUser = await account.get();
      } catch {}

      // 2. If no active session and token parameters exist in URL, perform server-side session exchange
      if (!rawUser && token) {
        // Primary Attempt: Server-side token exchanger (creates a full JWT session via Server API key)
        try {
          const exec = await functions.createExecution(
            'auth-webhook',
            JSON.stringify({ action: 'exchange_token', userId: token.userId, secret: token.rawSecret })
          );
          if (exec && exec.responseBody) {
            const parsed = JSON.parse(exec.responseBody);
            if (parsed.ok && parsed.sessionSecret) {
              persistSession(parsed.sessionSecret);
              rawUser = parsed.user;
            }
          }
        } catch (e1) {
          console.warn('[Auth] Server token exchange execution error:', e1);
        }

        // Fallback Attempt 1: Client SDK createSession using rawSecret (full JWT string)
        if (!rawUser) {
          try {
            const session = await account.createSession(token.userId, token.rawSecret);
            if (session && session.secret) {
              persistSession(session.secret);
            }
          } catch (e2) {}
        }

        // Fallback Attempt 2: Client direct REST createSession using rawSecret
        if (!rawUser) {
          try {
            const session = await directCreateSession(token.userId, token.rawSecret);
            if (session && session.secret) {
              persistSession(session.secret);
            }
          } catch (e3) {}
        }

        // Query account after session creation attempts
        if (!rawUser) {
          try {
            rawUser = await account.get();
          } catch (e4) {
            const secret = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_STORAGE_KEY) : null;
            if (secret) {
              try {
                rawUser = await directGetAccount(secret);
              } catch (e5) {}
            }
          }
        }
      }

      // 3. Resolve user profile if rawUser is available
      if (rawUser) {
        cleanTokenFromUrl();
        void ensurePersistentJWT();

        const plan = await loadPlan(rawUser.$id || rawUser.id, rawUser);
        const resolved = toAuthUser(rawUser, plan);
        setUserRef.current(resolved);
        setCachedUser(resolved);
        return { ok: true, user: resolved };
      }

      // 4. Check cached user as fallback
      const cached = getCachedUser();
      if (cached) {
        cleanTokenFromUrl();
        setUserRef.current(cached);
        return { ok: true, user: cached };
      }

      return {
        ok: false,
        reason: 'get_account_failed',
        detail: 'Could not resolve authenticated account from session or token.',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await account.createEmailPasswordSession(email, password);
    if (session && session.secret) {
      persistSession(session.secret);
    }
    void ensurePersistentJWT();
    await refreshSession();
  }, [refreshSession]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await account.create(ID.unique(), email, password, name);
    const session = await account.createEmailPasswordSession(email, password);
    if (session && session.secret) {
      persistSession(session.secret);
    }
    void ensurePersistentJWT();
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
