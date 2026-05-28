import { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';

export function ForgotPassword({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { sendPasswordRecovery } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordRecovery(email);
      setDone(true);
    } catch {
      setError('Unable to send reset email right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] px-6 pb-10 pt-32">
      <SEO title="Forgot Password" description="Reset your Qofeno password." />
      <div className="mx-auto max-w-md rounded-3xl border border-white/60 bg-white p-8 shadow-2xl shadow-purple-900/5">
        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h1 className="text-3xl font-black text-[#0F0A1E]">Forgot password</h1>
              <p className="mt-2 text-sm text-neutral-500">We’ll send a reset link to your email address.</p>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Email address</span>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-4 text-sm text-neutral-800 outline-none transition-all focus:border-purple-600 focus:bg-white"
                  placeholder="you@example.com"
                />
                <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400" />
              </div>
            </label>
            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
            <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-70">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
            </button>
            <button type="button" onClick={() => onNavigate('login')} className="w-full text-sm font-bold text-neutral-500 hover:text-purple-600">
              Back to login
            </button>
          </form>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500" />
            <h2 className="text-2xl font-black text-[#0F0A1E]">Check your inbox</h2>
            <p className="mt-2 text-sm text-neutral-500">If that email exists, a reset link has been sent.</p>
          </div>
        )}
      </div>
    </div>
  );
}
