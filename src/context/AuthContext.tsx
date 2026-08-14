import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ID, OAuthProvider, Query } from 'appwrite';
import { account, DATABASE_ID, databases, functions, clearPersistedSession, realtime } from '../lib/qofeno-appwrite';

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
  avatarUrl?: string;
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
  deleteAccount: () => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  createOAuthSession: (provider: 'google' | 'github', redirect?: string) => void;
  updateUser: (data: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// SECURITY: Only non-sensitive flags stored in localStorage.
// NO JWT, NO session tokens, NO email, NO name, NO plan.
const LOGGED_OUT_KEY = 'qofeno_user_logged_out';
const APPWRITE_PROJECT_ID = '69c58725000ef2b43f18';

async function loadPlan(userId: string, rawUser?: any): Promise<AuthPlan> {
  const email = String(rawUser?.email || '').trim().toLowerCase();

  // Founder account — exact email match only
  if (email === 'sohailkhannn.0525@gmail.com') {
    return 'teams';
  }

  // Database subscription plan check for registered users
  try {
    const docs = await databases.listDocuments(DATABASE_ID, 'users_meta', [
      Query.equal('user_id', userId),
      Query.limit(1),
    ]);
    if (docs?.documents?.length > 0) {
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

  // 1. Check Appwrite targets array
  if (Array.isArray(raw.targets)) {
    const oauthTarget = raw.targets.find(
      (t: any) => t.providerType === 'oauth2' || t.provider || t.providerType === 'google' || t.providerType === 'github'
    );
    if (oauthTarget) {
      isOAuth = true;
      provider = String(oauthTarget.provider || oauthTarget.providerType || 'google');
    }
  }

  // 2. Check provider property
  if (raw.provider) {
    const p = String(raw.provider).toLowerCase();
    if (p !== 'email' && p !== 'email/password') {
      isOAuth = true;
      provider = p;
    }
  }

  // 3. OAuth accounts have no password — passwordUpdate is 0/empty
  if (!raw.passwordUpdate || raw.passwordUpdate === 0 || raw.passwordUpdate === '0') {
    isOAuth = true;
  }

  // 4. Check stored local OAuth provider flag (non-sensitive — just provider name string)
  const storedOauth = typeof window !== 'undefined' ? localStorage.getItem('qofeno_oauth_provider') : null;
  if (storedOauth) {
    isOAuth = true;
    if (provider === 'email') provider = storedOauth;
  }

  // 5. Google email heuristic
  const rawEmail = String(raw.email || '');
  if (rawEmail.endsWith('@gmail.com') || rawEmail.endsWith('@googlemail.com')) {
    isOAuth = true;
    if (provider === 'email') provider = 'google';
  }

  const name = String(
    raw.prefs?.display_name || raw.prefs?.name || raw.name || (rawEmail ? rawEmail.split('@')[0] : 'User')
  );
  // Avatar URL is non-sensitive — storing provider-issued avatar URL is safe
  const avatarUrl = String(
    raw.prefs?.avatarUrl || raw.prefs?.avatar_url || raw.prefs?.avatar ||
    (typeof window !== 'undefined' ? localStorage.getItem('qofeno_avatar_url') || '' : '')
  );

  return {
    id: String(raw.$id || raw.id || ''),
    name,
    email: rawEmail,
    emailVerification: Boolean(raw.emailVerification),
    plan,
    createdAt: created,
    $createdAt: created,
    provider,
    isOAuth,
    avatarUrl,
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

// Direct Appwrite API call — used as fallback when cookie-based SDK call fails
async function directCreateSession(userId: string, secret: string): Promise<any> {
  const res = await fetch(`https://cloud.appwrite.io/v1/account/sessions/token`, {
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
    try { msg = JSON.parse(text).message || text; } catch {}
    throw new Error(`[${res.status}] ${msg}`);
  }
  return JSON.parse(text);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    setIsLoading(true);

    // If user explicitly logged out — don't attempt to restore session
    if (typeof window !== 'undefined' && window.localStorage.getItem(LOGGED_OUT_KEY) === 'true') {
      try { await account.deleteSession('current'); } catch {}
      clearPersistedSession();
      setUserRef.current(null);
      setIsLoading(false);
      return null;
    }

    let raw: any = null;

    try {
      // Primary: Appwrite HTTP-only cookie session
      raw = await account.get();
    } catch {
      // Session cookie missing or expired — user is not logged in
    }

    if (raw) {
      const plan = await loadPlan(raw.$id || raw.id, raw);
      const resolved = toAuthUser(raw, plan);
      setUserRef.current(resolved);
      setIsLoading(false);
      return resolved;
    }

    // No valid session — clear state
    clearPersistedSession();
    setUserRef.current(null);
    setIsLoading(false);
    return null;
  }, []);

  const exchangeOAuthToken = useCallback(async (): Promise<OAuthExchangeResult> => {
    setIsLoading(true);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOGGED_OUT_KEY);
    }

    try {
      const token = getTokenFromUrl();
      let rawUser: any = null;

      // 1. If URL contains OAuth token — exchange for a session
      if (token) {
        try {
          await directCreateSession(token.userId, token.secret);
        } catch (eA) {
          try {
            await account.createSession(token.userId, token.secret);
          } catch (eB) {
            console.warn('[Auth] OAuth token exchange failed:', eB);
          }
        }
      }

      // 2. Get account via session cookie (set by createSession above)
      try {
        rawUser = await account.get();
      } catch {}

      if (rawUser) {
        cleanTokenFromUrl();
        const plan = await loadPlan(rawUser.$id || rawUser.id, rawUser);
        const resolved = toAuthUser(rawUser, plan);
        setUserRef.current(resolved);
        return { ok: true, user: resolved };
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

  // Initial session check on mount
  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  // Appwrite Realtime — live auth + subscription sync
  useEffect(() => {
    let unsubAccount: any = null;
    let unsubSub: any = null;

    try {
      unsubAccount = realtime.subscribe('account', (response) => {
        if (response.events.some(e => e.includes('.sessions.') || e.includes('.update') || e.includes('.delete'))) {
          void refreshSession();
        }
      });

      if (user?.id) {
        unsubSub = realtime.subscribe(
          `databases.${DATABASE_ID}.collections.subscriptions.documents`,
          (response) => {
            if (response.payload && (response.payload as any).user_id === user.id) {
              void refreshSession();
            }
          }
        );
      }
    } catch (e) {
      console.warn('[Auth] Realtime subscription error:', e);
    }

    return () => {
      if (typeof unsubAccount === 'function') unsubAccount();
      if (typeof unsubSub === 'function') unsubSub();
    };
  }, [refreshSession, user?.id]);

  const login = useCallback(async (email: string, password: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOGGED_OUT_KEY);
    }
    try {
      // Appwrite sets HTTP-only session cookie automatically
      await account.createEmailPasswordSession(email, password);
      await refreshSession().catch(() => {});
    } catch (err: any) {
      const code = err?.code || err?.status;
      const type = String(err?.type || '');
      const msg  = String(err?.message || err || '');

      if (code === 401 || type.includes('invalid_credentials') || msg.toLowerCase().includes('invalid credentials')) {
        throw new Error('Invalid email or password. Please verify your credentials and try again.');
      }
      if (code === 404 || type.includes('user_not_found')) {
        throw new Error('No account found with this email. Please check your email or create an account.');
      }
      if (code === 429 || type.includes('rate_limit')) {
        throw new Error('Too many login attempts. Please wait a moment and try again.');
      }
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        throw new Error('Unable to connect. Please check your internet connection and try again.');
      }
      throw new Error(msg || 'Sign in failed. Please verify your credentials and try again.');
    }
  }, [refreshSession]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOGGED_OUT_KEY);
    }
    const cleanEmail    = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName     = name.trim();

    try {
      await account.create(ID.unique(), cleanEmail, cleanPassword, cleanName);
      // Appwrite sets HTTP-only session cookie automatically
      await account.createEmailPasswordSession(cleanEmail, cleanPassword);
      try {
        await account.createVerification(`${window.location.origin}/auth/callback?redirect=/profile`);
      } catch (e) {
        console.warn('[Auth] Verification email skipped (non-fatal):', e);
      }
      await refreshSession().catch(() => {});
    } catch (err: any) {
      const code = err?.code || err?.status;
      const type = String(err?.type || '');
      const msg  = String(err?.message || err || '');

      if (code === 409 || type.includes('user_already_exists') || msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
        throw new Error('The given user/email address is already taken up. Please sign in instead.');
      }
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        throw new Error('Unable to connect. Please check your internet connection and try again.');
      }
      throw new Error(msg || 'Account creation failed. Please check your details and try again.');
    }
  }, [refreshSession]);

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      // Set the logged-out flag so refreshSession() won't restore session on next visit
      window.localStorage.setItem(LOGGED_OUT_KEY, 'true');
      // Clean up any non-sensitive UI state
      window.localStorage.removeItem('qofeno_oauth_provider');
      window.localStorage.removeItem('qofeno_avatar_url');
      window.localStorage.removeItem('qofeno_guest_name');
    }

    try { await account.deleteSession('current'); } catch {}
    try { await account.deleteSessions(); } catch {}
    clearPersistedSession();
    setUserRef.current(null);
    setIsLoading(false);
  }, []);

  const deleteAccount = useCallback(async () => {
    const currentUserId = user?.id;
    if (!currentUserId) return;

    setIsLoading(true);

    // 1. Trigger serverless permanent deletion across Appwrite Auth and collections
    try {
      await functions.createExecution(
        'auth-webhook',
        JSON.stringify({ action: 'delete_user', userId: currentUserId }),
        false
      );
    } catch (fnErr) {
      console.warn('[Auth] Server user deletion notice:', fnErr);
    }

    // 2. Direct client collection cleanup fallback
    try {
      const collections = ['users_meta', 'tool_likes', 'notifications', 'subscriptions', 'recently_viewed'];
      for (const col of collections) {
        try {
          const docs = await databases.listDocuments(DATABASE_ID, col, [
            Query.equal('user_id', currentUserId),
            Query.limit(50),
          ]);
          for (const doc of docs.documents) {
            try { await databases.deleteDocument(DATABASE_ID, col, doc.$id); } catch {}
          }
        } catch {}
      }
    } catch {}

    // 3. Clear sessions in Appwrite Auth
    try { await account.deleteSession('current'); } catch {}
    try { await account.deleteSessions(); } catch {}

    // 4. Clear local cache
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOGGED_OUT_KEY, 'true');
      window.localStorage.removeItem('qofeno_oauth_provider');
      window.localStorage.removeItem('qofeno_avatar_url');
      window.localStorage.removeItem('qofeno_guest_name');
      window.localStorage.removeItem('qofeno_likes');
      window.localStorage.removeItem('recently_viewed');
    }
    clearPersistedSession();

    // 5. Update state instantaneously in Realtime with NO page reload needed
    setUserRef.current(null);
    setIsLoading(false);
  }, [user?.id]);

  const sendPasswordRecovery = useCallback(async (email: string) => {
    await account.createRecovery(email, `${window.location.origin}/reset-password`);
  }, []);

  const createOAuthSession = useCallback((provider: 'google' | 'github', redirect = '/profile') => {
    if (typeof window !== 'undefined') {
      // Store OAuth provider name (non-sensitive — just string 'google'/'github')
      localStorage.setItem('qofeno_oauth_provider', provider);
    }
    const success = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    const failure = `${window.location.origin}/login?error=oauth&redirect=${encodeURIComponent(redirect)}`;
    const oauthProvider = provider === 'google' ? OAuthProvider.Google : OAuthProvider.Github;
    try {
      account.createOAuth2Session(oauthProvider, success, failure);
    } catch {
      account.createOAuth2Token(oauthProvider, success, failure);
    }
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUserRef.current(prev => {
      if (!prev) return null;
      return { ...prev, ...data };
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: Boolean(user), isLoading,
      refreshSession, exchangeOAuthToken,
      login, signup, logout, deleteAccount, sendPasswordRecovery, createOAuthSession, updateUser,
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
