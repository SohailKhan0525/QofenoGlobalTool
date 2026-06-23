import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { SEO } from '../../components/SEO';
import { getRedirectTarget } from '../../lib/appRouter';
import { useAuth } from '../../context/AuthContext';

export function AuthCallback({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { refreshSession } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        await refreshSession();
        onNavigate(getRedirectTarget(window.location.search));
      } catch {
        setError('Unable to complete sign-in.');
      }
    };
    void run();
  }, [onNavigate, refreshSession]);

  return (
    <div className="min-h-screen bg-[#F5F3FF] px-6 pt-32 flex items-center justify-center">
      <SEO title="Signing you in" description="Completing your Qofeno sign-in." />
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-8 text-center shadow-2xl shadow-purple-900/5">
        {!error ? (
          <>
            <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-600" />
            <h1 className="text-2xl font-black text-[#0F0A1E]">Finishing sign-in</h1>
            <p className="mt-2 text-sm text-neutral-500">Please wait while we confirm your session.</p>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faCircleCheck} className="mx-auto mb-4 h-12 w-12 text-rose-500" />
            <h1 className="text-2xl font-black text-[#0F0A1E]">Sign-in failed</h1>
            <p className="mt-2 text-sm text-neutral-500">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
