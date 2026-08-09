import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faEnvelope, faLock, faEye, faEyeSlash,
  faCircleExclamation, faCircleCheck, faSpinner, faShield,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

// Get the post-auth redirect target fresh from the URL every time it's needed.
function getTarget() {
  return new URLSearchParams(window.location.search).get('redirect') || '/profile';
}

export function Auth({ type, onNavigate }: { type: 'login' | 'signup'; onNavigate: (page: string) => void }) {
  const { login, signup, createOAuthSession } = useAuth();
  const [isLogin, setIsLogin] = useState(type === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Show OAuth error returned from Appwrite callback failure URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'oauth') {
      triggerError('Google sign-in failed. Your Google account may not be linked yet — try signing in with email & password first, or contact support.');
    } else if (err) {
      triggerError(`Authentication error: ${err}`);
    }
  }, []);

  function sanitizeAuthError(msg: string): string {
    if (!msg) return 'Authentication failed. Please try again.';
    const lower = msg.toLowerCase();
    if (lower.includes('invalid credentials') || lower.includes('invalid email or password') || lower.includes('user_invalid_credentials')) {
      return 'Invalid email or password. Please verify your login credentials and try again.';
    }
    if (lower.includes('user_not_found') || lower.includes('no account found')) {
      return 'No account found with this email. Please check your email or create a new account.';
    }
    if (lower.includes('user_already_exists') || lower.includes('already exists')) {
      return 'An account with this email address already exists. Please sign in instead.';
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }
    if (msg === 'Failed to fetch' || msg === 'TypeError: Failed to fetch' || msg.includes('NetworkError')) {
      return 'Unable to connect to authentication server. Please check your internet connection and try again.';
    }
    return msg.replace(/\(https?:\/\/[^\)]+\)/g, '').replace(/cloud\.appwrite\.io/g, '').trim();
  }

  function triggerError(msg: string) {
    setErrorMessage(sanitizeAuthError(msg));
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function validate() {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email.';
    if (!password.trim()) return 'Password is required.';
    if (!isLogin && !name.trim()) return 'Full name is required.';
    if (!isLogin && password.length < 8) return 'Password must be at least 8 characters.';
    if (!isLogin && !agreedToTerms) return 'Please agree to the Terms of Service.';
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) return 'Please complete the captcha.';
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { triggerError(err); return; }

    setIsLoading(true);
    setErrorMessage('');
    const target = getTarget();
    try {
      if (isLogin) {
        await login(email.trim(), password);
        toast.success('Welcome back!', { description: 'You are now signed in.' });
      } else {
        await signup(name.trim(), email.trim(), password);
        toast.success(`Welcome to Qofeno, ${name.trim().split(' ')[0]}! 🎉`, {
          description: 'Your account is ready. Check your inbox to verify your email.',
        });
      }
      // If we get here, auth succeeded — navigate to the target
      onNavigate(target);
    } catch (e) {
      triggerError(e instanceof Error ? e.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthLoading(provider);
    setErrorMessage('');
    const target = getTarget();
    try {
      // This triggers a full-page redirect — nothing after it runs.
      await createOAuthSession(provider, target);
    } catch (e) {
      triggerError(e instanceof Error ? e.message : `${provider} sign-in failed.`);
      setOauthLoading(null);
    }
  }

  function toggleMode() {
    const next = !isLogin;
    setIsLogin(next);
    setErrorMessage('');
    // Preserve the redirect query parameter when switching modes
    const qs = window.location.search;
    const base = next ? '/login' : '/signup';
    onNavigate(qs ? `${base}${qs}` : base);
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-white to-[#EEF2FF] flex flex-col items-center justify-center pt-28 pb-10 px-4 relative overflow-hidden">
      <SEO
        title={isLogin ? 'Sign In — Qofeno' : 'Create Account — Qofeno'}
        description="Sign in or create a Qofeno account to unlock Pro tools, save your history, and more."
      />

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-20 h-[500px] w-[500px] rounded-full bg-purple-300/20 blur-[140px]" />
        <div className="absolute bottom-0 -right-20 h-[400px] w-[400px] rounded-full bg-indigo-300/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-200/10 blur-[160px]" />
      </div>

      {/* Back button */}
      <button
        onClick={() => onNavigate('home')}
        className="absolute top-[88px] left-5 md:left-8 flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-purple-600 transition-colors z-20 cursor-pointer"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
        Back to home
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Card */}
        <div className="rounded-[28px] border border-white/80 bg-white/90 backdrop-blur-xl shadow-2xl shadow-purple-900/10 px-8 pt-8 pb-8">

          {/* Logo + header */}
          <div className="flex flex-col items-center mb-7">
            <div className="mb-4 flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-500/30">
              <FontAwesomeIcon icon={faShield} className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-center text-[26px] font-black tracking-tight text-[#0F0A1E]">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1 text-center text-sm text-neutral-500">
              {isLogin
                ? 'Sign in to access your tools and history'
                : 'Get started with 200+ free tools — no card needed'}
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              id="btn-google-oauth"
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading || isLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {oauthLoading === 'google' ? (
                <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin text-neutral-500" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Google
            </button>

            <button
              type="button"
              id="btn-github-oauth"
              onClick={() => handleOAuth('github')}
              disabled={!!oauthLoading || isLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {oauthLoading === 'github' ? (
                <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faGithub} className="h-4 w-4" />
              )}
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-100" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">or continue with email</span>
            <div className="h-px flex-1 bg-neutral-100" />
          </div>

          {/* Error message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="font-medium leading-snug">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={cn('space-y-4', shake && 'animate-shake')}
            noValidate
          >
            {/* Name field — signup only */}
            <AnimatePresence initial={false}>
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Full Name
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUser} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 h-3.5 w-3.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3.5 pl-10 pr-4 text-sm font-medium text-neutral-800 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100 text-[16px]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Email Address
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 h-3.5 w-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3.5 pl-10 pr-4 text-sm font-medium text-neutral-800 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100 text-[16px]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 h-3.5 w-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3.5 pl-10 pr-11 text-sm font-medium text-neutral-800 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100 text-[16px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  tabIndex={-1}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                </button>
              </div>

              {/* Password strength indicator — signup only */}
              {!isLogin && password.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-all duration-300',
                        strength >= i
                          ? i === 1 ? 'bg-rose-400' : i === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-neutral-200'
                      )}
                    />
                  ))}
                  <span className={cn(
                    'ml-1 text-[10px] font-bold',
                    strength === 1 ? 'text-rose-500' : strength === 2 ? 'text-amber-500' : 'text-emerald-500'
                  )}>
                    {strength === 1 ? 'Weak' : strength === 2 ? 'Fair' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            {/* Terms checkbox — signup only */}
            {!isLogin && (
              <label className="flex cursor-pointer items-start gap-2.5">
                <div className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-neutral-300 transition-colors checked:border-purple-600 checked:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="pointer-events-none absolute h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100"
                  />
                </div>
                <span className="text-[11px] font-medium leading-snug text-neutral-600">
                  I agree to Qofeno's{' '}
                  <button type="button" onClick={() => onNavigate('terms')} className="font-bold text-purple-600 underline cursor-pointer hover:text-purple-800">Terms</button>
                  {' '}and{' '}
                  <button type="button" onClick={() => onNavigate('policy')} className="font-bold text-purple-600 underline cursor-pointer hover:text-purple-800">Privacy Policy</button>
                </span>
              </label>
            )}

            {/* Turnstile captcha */}
            {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
              <div className="flex justify-center pt-1">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={token => setTurnstileToken(token)}
                  onError={() => triggerError('Captcha failed. Please refresh and try again.')}
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isLoading || !!oauthLoading}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                  <span>{isLogin ? 'Signing in…' : 'Creating account…'}</span>
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-sm text-neutral-500">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-bold text-purple-600 hover:text-purple-700 cursor-pointer transition-colors"
            >
              {isLogin ? 'Sign up free →' : 'Sign in →'}
            </button>
          </p>
        </div>

        {/* Bottom note */}
        <p className="mt-5 text-center text-xs text-neutral-400">
          Free tools don't require an account.{' '}
          <button
            onClick={() => onNavigate('tools')}
            className="font-bold text-purple-500 hover:underline cursor-pointer"
          >
            Explore all tools →
          </button>
        </p>
      </motion.div>
    </div>
  );
}
