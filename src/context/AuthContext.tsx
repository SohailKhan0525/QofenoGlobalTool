import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ID, OAuthProvider, Query } from 'appwrite';
import { account, DATABASE_ID, databases } from '../lib/qofeno-appwrite';

export type AuthPlan = 'free' | 'pro';

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
    const docs = await databases.listDocuments(DATABASE_ID, 'users_meta', [Query.equal('user_id', userId), Query.limit(1)]);
    const plan = String(docs.documents?.[0]?.plan || 'free').toLowerCase();
    return plan === 'pro' ? 'pro' : 'free';
  } catch {
    return 'free';
  }
}

function toAuthUser(user: any, plan: AuthPlan): AuthUser {
  return {
    id: String(user.$id),
    name: String(user.name || user.email || 'User'),
    email: String(user.email || ''),
    emailVerification: Boolean(user.emailVerification),
    plan,
  };
}

function hasAppwriteSessionCookie() {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('a_session_');
}

function expectsActiveSession() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_SESSION_MARKER) === 'true';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      if (!expectsActiveSession()) {
        setUser(null);
        return;
      }
      const sessionUser = await account.get();
      const plan = await loadPlan(sessionUser.$id);
      window.localStorage.setItem(AUTH_SESSION_MARKER, 'true');
      setUser(toAuthUser(sessionUser, plan));
    } catch {
      window.localStorage.removeItem(AUTH_SESSION_MARKER);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password);
    window.localStorage.setItem(AUTH_SESSION_MARKER, 'true');
    await refreshSession();
  };

  const signup = async (name: string, email: string, password: string) => {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    window.localStorage.setItem(AUTH_SESSION_MARKER, 'true');
    await account.createVerification(`${window.location.origin}/auth/callback?redirect=/dashboard`);
    await refreshSession();
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } finally {
      window.localStorage.removeItem(AUTH_SESSION_MARKER);
      setUser(null);
      setIsLoading(false);
    }
  };

  const sendPasswordRecovery = async (email: string) => {
    await account.createRecovery(email, `${window.location.origin}/reset-password`);
  };

  const createOAuthSession = async (provider: 'google' | 'github', redirect = '/dashboard') => {
    const success = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    const failure = `${window.location.origin}/login?error=oauth&redirect=${encodeURIComponent(redirect)}`;
    window.localStorage.setItem(AUTH_SESSION_MARKER, 'true');
    const oauthProvider = provider === 'google' ? OAuthProvider.Google : OAuthProvider.Github;
    await account.createOAuth2Session(oauthProvider, success, failure);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    refreshSession,
    login,
    signup,
    logout,
    sendPasswordRecovery,
    createOAuthSession,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
