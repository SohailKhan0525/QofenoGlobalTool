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
  createdAt?: string;
  $createdAt?: string;
  provider?: string;
  isOAuth?: boolean;
};

export type OAuthExchangeResult =
  | { ok: true;  user: AuthUser }
  | { ok: false; reason: 'no_token' | 'create_session_failed' | 'get_account_failed' | 'exception'; detail: string };

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
      if (parsed && typeof parsed === 'object' && parsed.id) {
        const email = String(parsed.email || '').trim().toLowerCase();
        if (email !== 'sohailkhannn.0525@gmail.com' && parsed.plan !== 'free') {
          parsed.plan = 'free';
        }
        return parsed as AuthUser;
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
  const email = String(rawUser?.email || '').trim().toLowerCase();

  // Founder account check — exact email match only
  if (email === 'sohailkhannn.0525@gmail.com') {
    return 'teams';
  }

  // Database subscription plan check for registered users
  try {
    const docs = await databases.listDocuments(DATABASE_ID, 'users_meta', [
      Query.equal('user_id', userId),
      Query.limit(1),
    ]);
    if (docs && docs.documents && docs.documents.length > 0) {
      const doc = docs.documents[0];
      const plan = String(doc.plan || 'free').toLowerCase();
      const expiresAt = doc.plan_expires_at ? new Date(doc.plan_expires_at).getTime() : null;

      if (expiresAt && expiresAt < Date.now()) {
        return 'free';
      }

      if (plan === 'pro') return 'pro';
      if (plan === 'teams') return 'teams';
    }
  } catch {}

  return 'free';
}

function toAuthUser(raw: any, plan: AuthPlan = 'free'): AuthUser {
  const created = String(raw.$createdAt || raw.createdAt || raw.created_at || new Date().toISOString());
  
  let provider = 'email';
  let isOAuth = false;
  if (Array.isArray(raw.targets)) {
    const hasOAuth = raw.targets.some((t: any) => t.providerType === 'oauth2' || t.provider);
    if (hasOAuth) isOAuth = true;
  }
  if (raw.provider) {
    provider = String(raw.provider);
    if (provider !== 'email') isOAuth = true;
  }

  const name = String(raw.prefs?.display_name || raw.name || raw.email || 'User');

  return {
    id: String(raw.$id || raw.id || ''),
    name,
    email: String(raw.email || ''),
    emailVerification: Boolean(raw.emailVerification),
    plan,
    createdAt: created,
    $createdAt: created,
    provider,
    isOAuth,
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
  const isJWT = sessionSecret.startsWith('ey');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': APPWRITE_PROJECT_ID,
  };
  if (isJWT) {
    headers['X-Appwrite-JWT'] = sessionSecret;
  } else {
    headers['X-Appwrite-Session'] = sessionSecret;
  }

  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(`${ep}/account`, {
        method: 'GET',
        credentials: 'include',
        headers,
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

      // 1. Immediate token binding if URL contains secret
      if (token) {
        if (token.rawSecret.startsWith('ey')) {
          persistSession(token.rawSecret);
        } else if (token.secret) {
          persistSession(token.secret);
        }
        try {
          rawUser = await directGetAccount(token.rawSecret);
        } catch {}

        if (!rawUser && token.secret) {
          try {
            rawUser = await directGetAccount(token.secret);
          } catch {}
        }
      }

      // 2. Try standard account.get()
      if (!rawUser) {
        try {
          rawUser = await account.get();
        } catch {}
      }

      // 3. Perform session creation attempts if user is still not resolved
      if (!rawUser && token) {
        // Attempt A: account.createSession with extracted secret
        if (token.secret) {
          try {
            const session = await account.createSession(token.userId, token.secret);
            if (session && session.secret) {
              persistSession(session.secret);
            }
          } catch (eA) {}
        }

        // Attempt B: account.createSession with rawSecret
        if (!rawUser && token.rawSecret) {
          try {
            const session = await account.createSession(token.userId, token.rawSecret);
            if (session && session.secret) {
              persistSession(session.secret);
            }
          } catch (eB) {}
        }

        // Attempt C: directCreateSession with extracted secret
        if (!rawUser && token.secret) {
          try {
            const session = await directCreateSession(token.userId, token.secret);
            if (session && session.secret) {
              persistSession(session.secret);
            }
          } catch (eC) {}
        }

        // Attempt D: directCreateSession with rawSecret
        if (!rawUser && token.rawSecret) {
          try {
            const session = await directCreateSession(token.userId, token.rawSecret);
            if (session && session.secret) {
              persistSession(session.secret);
            }
          } catch (eD) {}
        }

        // Re-query account after session creation attempts
        try {
          rawUser = await account.get();
        } catch (e1) {
          if (token.rawSecret) {
            try { rawUser = await directGetAccount(token.rawSecret); } catch {}
          }
          if (!rawUser && token.secret) {
            try { rawUser = await directGetAccount(token.secret); } catch {}
          }
        }
      }

      // 4. Resolve user profile if rawUser was fetched
      if (rawUser) {
        cleanTokenFromUrl();
        void ensurePersistentJWT();

        const plan = await loadPlan(rawUser.$id || rawUser.id, rawUser);
        const resolved = toAuthUser(rawUser, plan);
        setUserRef.current(resolved);
        setCachedUser(resolved);
        return { ok: true, user: resolved };
      }

      // 5. Fallback to cached user if present
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
    } catch (err: any) {
      console.error('[Auth] exchangeOAuthToken error:', err);
      return {
        ok: false,
        reason: 'exception',
        detail: err.message || 'An unexpected error occurred during sign-in.',
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
