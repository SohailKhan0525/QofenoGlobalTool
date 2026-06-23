import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faSpinner, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { SEO } from '../../components/SEO';
import { account } from '../../lib/qofeno-appwrite';

export function ResetPassword({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Extract userId and secret from URL
  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    if (!userId || !secret) {
      setError("Invalid or expired password reset link.");
    }
  }, [userId, secret]);

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const allPassed = checks.length && checks.uppercase && checks.special;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId || !secret) {
      setError("Invalid or expired password reset link.");
      return;
    }

    if (!allPassed) {
      setError('Please satisfy all password strength requirements.');
      return;
    }

    setIsLoading(true);
    try {
      await account.updateRecovery(userId, secret, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please request a new link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] px-6 pb-10 pt-32">
      <SEO title="Reset Password" description="Create a new password for Qofeno." />
      <div className="mx-auto max-w-md rounded-3xl border border-white/60 bg-white p-8 shadow-2xl shadow-purple-900/5">
        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h1 className="text-3xl font-black text-[#0F0A1E]">Set new password</h1>
              <p className="mt-2 text-sm text-neutral-500">Create a strong password to secure your account.</p>
            </div>
            
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">New Password</span>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-4 text-sm text-neutral-800 outline-none transition-all focus:border-purple-600 focus:bg-white"
                  placeholder="••••••••"
                />
                <FontAwesomeIcon icon={faLock} className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400" />
              </div>
            </label>

            {/* Password Strength Checklist */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-2">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Password Requirements</p>
              
              <div className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={checks.length ? faCircleCheck : faCircleXmark} className={checks.length ? "text-green-500" : "text-neutral-300"} />
                <span className={checks.length ? "text-neutral-800 font-medium" : "text-neutral-500"}>At least 8 characters</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={checks.uppercase ? faCircleCheck : faCircleXmark} className={checks.uppercase ? "text-green-500" : "text-neutral-300"} />
                <span className={checks.uppercase ? "text-neutral-800 font-medium" : "text-neutral-500"}>At least one uppercase letter</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={checks.special ? faCircleCheck : faCircleXmark} className={checks.special ? "text-green-500" : "text-neutral-300"} />
                <span className={checks.special ? "text-neutral-800 font-medium" : "text-neutral-500"}>At least one special character</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !allPassed || !userId || !secret} 
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        ) : (
          <div className="py-8 text-center">
            <FontAwesomeIcon icon={faCircleCheck} className="mx-auto mb-4 h-14 w-14 text-green-500" />
            <h2 className="text-2xl font-black text-[#0F0A1E]">Password updated</h2>
            <p className="mt-2 text-sm text-neutral-500 mb-6">Your password has been successfully reset. You can now login.</p>
            <button 
              type="button" 
              onClick={() => onNavigate('login')} 
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
