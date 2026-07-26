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
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  createOAuthSession: (provider: 'google' | 'github', redirect?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_SESSION_MARKER = 'qofeno_auth_expected';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use a ref so refreshSession always has access to the current setter without
  // needing to be re-declared (avoids stale-closure in login/signup callbacks).
  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await account.get();
      const plan = await loadPlan(raw.$id);
      window.localStorage.setItem(AUTH_SESSION_MARKER, 'true');
      setUserRef.current(toAuthUser(raw, plan));
    } catch {
      window.localStorage.removeItem(AUTH_SESSION_MARKER);
      setUserRef.current(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password);
    window.localStorage.setItem(AUTH_SESSION_MARKER, 'true');
    await refreshSession();
  }, [refreshSession]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    window.localStorage.setItem(AUTH_SESSION_MARKER, 'true');
    // Non-fatal: verification email may fail if SMTP not configured yet
    try {
      await account.createVerification(`${window.location.origin}/auth/callback?redirect=/profile`);
    } catch (e) {
      console.warn('Verification email skipped (non-fatal):', e);
    }
    await refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } finally {
      window.localStorage.removeItem(AUTH_SESSION_MARKER);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const sendPasswordRecovery = useCallback(async (email: string) => {
    await account.createRecovery(email, `${window.location.origin}/reset-password`);
  }, []);

  const createOAuthSession = useCallback(async (provider: 'google' | 'github', redirect = '/profile') => {
    const success = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    const failure = `${window.location.origin}/login?error=oauth&redirect=${encodeURIComponent(redirect)}`;
    window.localStorage.setItem(AUTH_SESSION_MARKER, 'true');
    const oauthProvider = provider === 'google' ? OAuthProvider.Google : OAuthProvider.Github;
    // This triggers a full browser redirect — nothing after this line runs.
    await account.createOAuth2Session(oauthProvider, success, failure);
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
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
