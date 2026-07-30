import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCircleXmark, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { getRedirectTarget } from '../../lib/appRouter';
import { useAuth, OAuthExchangeResult } from '../../context/AuthContext';

const REASON_LABELS: Record<string, string> = {
  no_token:             'No OAuth token found in the URL',
  create_session_failed:'Token found but session creation failed',
  get_account_failed:   'Session created but account.get() failed',
};

export function AuthCallback({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { exchangeOAuthToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<OAuthExchangeResult | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      const r = await exchangeOAuthToken();
      setResult(r);
      if (r.ok) {
        setStatus('success');
        setTimeout(() => {
          const target = getRedirectTarget(window.location.search);
          onNavigate(target);
        }, 500);
      } else {
        setStatus('error');
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <p className="mt-2 text-sm text-neutral-500">Verifying your session — just a moment.</p>
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

        {status === 'error' && result && !result.ok && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
                <FontAwesomeIcon icon={faCircleXmark} className="h-8 w-8 text-rose-500" />
              </div>
            </div>
            <h1 className="text-xl font-black text-[#0F0A1E]">Sign-in failed</h1>

            {/* Diagnostic info — helps identify root cause */}
            <div className="mt-4 rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-left text-xs text-neutral-600 space-y-1">
              <p><span className="font-bold">Reason:</span> {REASON_LABELS[result.reason] ?? result.reason}</p>
              <p className="break-all"><span className="font-bold">Detail:</span> {result.detail}</p>
            </div>

            <button
              onClick={() => {
                const redirect = getRedirectTarget(window.location.search);
                onNavigate(`/login?redirect=${encodeURIComponent(redirect)}`);
              }}
              className="mt-5 w-full rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              Try Signing In Again
            </button>
            <p className="mt-3 text-xs text-neutral-400">
              Please share the info above with support.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
