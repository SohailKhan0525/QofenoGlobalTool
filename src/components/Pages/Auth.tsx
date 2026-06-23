import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faEnvelope, faLock, faEye, faEyeSlash, faCircleExclamation,
  faCircleCheck, faSpinner, faTools,
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../context/AuthContext';

export function Auth({ type, onNavigate }: { type: 'login' | 'signup', onNavigate: (page: string) => void }) {
  const { login, signup, createOAuthSession } = useAuth();
  const [isLogin, setIsLogin] = useState(type === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const redirectTarget = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || '/dashboard';
  }, []);

  const triggerError = (message: string) => {
    setErrorMessage(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  };

  const validate = () => {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password.trim()) return 'Password is required.';
    if (!isLogin && !name.trim()) return 'Full name is required.';
    if (!isLogin && password.length < 8) return 'Password must be at least 8 characters.';
    if (!isLogin && !!import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) return 'Please complete the captcha verification.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      triggerError(validationError);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      if (isLogin) {
        await login(email.trim(), password);
        onNavigate(redirectTarget);
      } else {
        await signup(name.trim(), email.trim(), password);
        onNavigate('/dashboard');
      }
    } catch (err) {
      triggerError(err instanceof Error ? err.message : 'Unable to complete authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await createOAuthSession(provider, redirectTarget);
    } catch (err) {
      triggerError(err instanceof Error ? err.message : `${provider} sign-in failed.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col items-center justify-center pt-[100px] pb-6 px-6 relative overflow-hidden select-none">
      <SEO title={isLogin ? 'Login' : 'Sign Up'} description="Join Qofeno to get unlimited access to all tools." />

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-300/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-400/10 blur-[120px]" />
      </div>

      <button
        onClick={() => onNavigate('home')}
        className="absolute top-24 left-6 md:top-28 md:left-10 flex items-center gap-2 text-neutral-500 hover:text-purple-600 transition-colors font-semibold z-10 cursor-pointer"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" /> Back to home
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white rounded-3xl md:rounded-[32px] p-8 md:p-10 shadow-2xl shadow-purple-900/5 relative z-10 border border-white/50"
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FontAwesomeIcon icon={faTools} className="text-white text-xl" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-black text-2xl md:text-3xl text-[#0F0A1E] mb-2 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-neutral-500">
            {isLogin ? 'Sign in to access your Pro tools and history' : 'Unlock Pro tools and save your processing history'}
          </p>
        </div>

        <motion.form onSubmit={handleSubmit} className={cn('space-y-4', shake && 'animate-shake')}>
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1"
              >
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Full Name</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-purple-600 focus:bg-white px-4 py-3.5 rounded-xl outline-none transition-all text-neutral-800 text-sm font-medium text-[16px]"
                  placeholder="John Doe"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-purple-600 focus:bg-white pl-10 pr-4 py-3.5 rounded-xl outline-none transition-all text-neutral-800 text-sm font-medium text-[16px]"
                placeholder="you@example.com"
              />
              <FontAwesomeIcon icon={faEnvelope} className="text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Password</label>
              {isLogin && (
                <button type="button" onClick={() => onNavigate('forgot-password')} className="text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer">
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-purple-600 focus:bg-white pl-10 pr-10 py-3.5 rounded-xl outline-none transition-all text-neutral-800 text-sm font-medium text-[16px]"
                placeholder="••••••••"
              />
              <FontAwesomeIcon icon={faLock} className="text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                {showPassword ? <FontAwesomeIcon icon={faEyeSlash} className="w-4 h-4" /> : <FontAwesomeIcon icon={faEye} className="w-4 h-4" />}
              </button>
            </div>
            {!isLogin && password.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <div className={cn('h-1 flex-1 rounded-full transition-colors', password.length > 0 ? 'bg-red-400' : 'bg-neutral-200')} />
                <div className={cn('h-1 flex-1 rounded-full transition-colors', password.length > 5 ? 'bg-amber-400' : 'bg-neutral-200')} />
                <div className={cn('h-1 flex-1 rounded-full transition-colors', password.length > 8 ? 'bg-green-500' : 'bg-neutral-200')} />
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="pt-2 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input type="checkbox" required className="peer appearance-none w-4 h-4 border-2 border-neutral-300 rounded focus:ring-2 focus:ring-purple-600 focus:outline-none checked:bg-purple-600 checked:border-purple-600 transition-colors cursor-pointer" />
                  <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <span className="text-[11px] font-medium text-neutral-600 leading-tight">
                  I agree to the <button type="button" onClick={() => onNavigate('terms')} className="text-purple-600 hover:text-purple-800 font-bold underline cursor-pointer">Terms of Service</button> and <button type="button" onClick={() => onNavigate('policy')} className="text-purple-600 hover:text-purple-800 font-bold underline cursor-pointer">Privacy Policy</button>.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input type="checkbox" className="peer appearance-none w-4 h-4 border-2 border-neutral-300 rounded focus:ring-2 focus:ring-purple-600 focus:outline-none checked:bg-purple-600 checked:border-purple-600 transition-colors cursor-pointer" />
                  <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <span className="text-[11px] font-medium text-neutral-600 leading-tight">(Optional) Send me product updates, feature announcements, and Qofeno news.</span>
              </label>
            </div>
          )}

          {!isLogin && (
            <div className="flex justify-center my-4">
              {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => triggerError('Captcha verification failed. Please try again.')}
                />
              )}
            </div>
          )}
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3.5 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center cursor-pointer disabled:opacity-70"
          >
            {isLoading ? <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 fa-spin" /> : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </motion.form>

        <div className="flex items-center gap-4 my-6">
          <div className="h-[1px] flex-1 bg-neutral-100" />
          <span className="text-xs font-semibold text-neutral-400">or</span>
          <div className="h-[1px] flex-1 bg-neutral-100" />
        </div>

        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={isLoading}
          className="w-full py-3.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuth('github')}
          disabled={isLoading}
          className="mt-3 w-full py-3.5 bg-neutral-900 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-3 cursor-pointer"
        >
          <FontAwesomeIcon icon={faGithub} className="w-4 h-4" />
          Continue with GitHub
        </button>

        <p className="mt-8 text-center justify-center flex items-center gap-1.5 text-sm text-neutral-500 font-medium">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={() => {
              const next = !isLogin;
              setIsLogin(next);
              onNavigate(next ? 'login' : 'signup');
            }}
            className="text-purple-600 font-bold hover:underline cursor-pointer"
          >
            {isLogin ? 'Get started →' : 'Sign in →'}
          </button>
        </p>
      </motion.div>

      <p className="mt-8 text-xs text-neutral-400 font-medium z-10 relative">
        Free tools don't require signing in. <button onClick={() => onNavigate('tools')} className="text-purple-600 hover:underline cursor-pointer font-bold">Explore tools →</button>
      </p>
    </div>
  );
}
