import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCircleXmark, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { getRedirectTarget } from '../../lib/appRouter';
import { useAuth } from '../../context/AuthContext';

/** Retry refreshSession up to `maxTries` times with increasing delays.
 *  Appwrite may need a brief moment to finalize the session cookie after OAuth redirect. */
async function retryRefreshSession(
  refreshSession: () => Promise<import('../../context/AuthContext').AuthUser | null>,
  maxTries = 5,
  baseDelayMs = 600,
) {
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    const user = await refreshSession();
    if (user) return user;
    if (attempt < maxTries) {
      // Wait longer on each retry: 600ms, 1200ms, 1800ms, 2400ms…
      await new Promise(r => setTimeout(r, baseDelayMs * attempt));
    }
  }
  return null;
}

export function AuthCallback({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      // Small initial delay to allow the Appwrite session cookie to be committed
      // after the OAuth provider redirect. Without this, account.get() can fire
      // before the cookie is readable by the browser.
      await new Promise(r => setTimeout(r, 300));

      const resolvedUser = await retryRefreshSession(
        refreshSession,
        5,
        600,
      );

      if (!resolvedUser) {
        setStatus('error');
        setError(
          'We couldn\'t verify your session after sign-in. ' +
          'This usually means the OAuth provider redirect didn\'t complete correctly. ' +
          'Please try signing in again — if the problem persists, use email & password.'
        );
        return;
      }

      setStatus('success');
      setTimeout(() => {
        onNavigate(getRedirectTarget(window.location.search));
      }, 600);
    };

    void run();
  }, []); // run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-white to-[#EEF2FF] flex items-center justify-center px-4 pt-28 pb-10">
      <SEO title="Signing you in — Qofeno" description="Completing your Qofeno sign-in." />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-[28px] border border-white/80 bg-white/90 backdrop-blur-xl shadow-2xl shadow-purple-900/10 px-8 py-12 text-center"
      >
        {status === 'loading' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
                <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            </div>
            <h1 className="text-xl font-black text-[#0F0A1E]">Signing you in…</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Verifying your session with Appwrite.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <FontAwesomeIcon icon={faCircleCheck} className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            <h1 className="text-xl font-black text-[#0F0A1E]">Signed in!</h1>
            <p className="mt-2 text-sm text-neutral-500">Redirecting you now…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
                <FontAwesomeIcon icon={faCircleXmark} className="h-8 w-8 text-rose-500" />
              </div>
            </div>
            <h1 className="text-xl font-black text-[#0F0A1E]">Sign-in failed</h1>
            <p className="mt-2 text-sm text-neutral-500 leading-snug">{error}</p>
            <button
              onClick={() => {
                const redirect = getRedirectTarget(window.location.search);
                onNavigate(`/login?redirect=${encodeURIComponent(redirect)}`);
              }}
              className="mt-6 w-full rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              Try Signing In Again
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
