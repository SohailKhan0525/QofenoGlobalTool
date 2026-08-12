import React, { useState, lazy, Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { SEO } from '../../components/SEO';
import { motion } from 'framer-motion';
import { PlanToggle } from '../PlanToggle';
import { useAuth } from '../../context/AuthContext';

import { toast } from 'sonner';

const PayPalButton = lazy(() => import('../PayPal/PayPalButton').then(m => ({ default: m.PayPalButton })));
const Turnstile = lazy(() => import('@marsidev/react-turnstile').then(m => ({ default: m.Turnstile })));

export function Payment({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, isAuthenticated } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const planParam = (params.get('plan') || 'pro').toLowerCase();
  const planType = planParam === 'teams' ? 'teams' : 'pro';

  const [isYearly, setIsYearly] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const monthlyPrice = planType === 'teams' ? 19 : 11;
  const yearlyPrice = planType === 'teams' ? 11.40 : 6.60;
  const price = isYearly ? yearlyPrice : monthlyPrice;

  return (
    <div className="min-h-screen bg-neutral-50/50 py-16 px-4">
      <SEO 
        title={`Checkout — Upgrade to ${planType === 'teams' ? 'Qofeno Teams' : 'Qofeno Pro'}`}
        description="Upgrade your workspace for higher upload limits, server-side processing prioritization, and no watermark outputs."
      />
      
      <div className="max-w-md mx-auto bg-white rounded-[32px] border border-neutral-200/60 p-8 sm:p-10 shadow-2xl shadow-neutral-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faShieldHalved} className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0F0A1E]">Secure Checkout</h2>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Choose subscription billing</p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="mb-6 p-4 rounded-2xl bg-purple-50 border border-purple-150 flex items-center justify-between gap-3 shadow-xs">
            <div className="min-w-0">
              <p className="text-xs font-bold text-purple-900">Not signed in?</p>
              <p className="text-[11px] text-purple-600 font-medium truncate">Sign in to link Pro to your account</p>
            </div>
            <button
              onClick={() => onNavigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="mb-6 px-4 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span className="truncate">Purchasing for: <strong>{user?.email || user?.name || 'Your Account'}</strong></span>
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md uppercase">Signed In</span>
          </div>
        )}

        {/* Free account alternative banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-neutral-800">Want to try Qofeno for free first?</p>
            <p className="text-[11px] text-neutral-500 font-medium truncate">Explore 500+ free online tools anytime</p>
          </div>
          <button
            onClick={() => {
              toast.info('Switched to Free Account', { description: 'Enjoy 500+ free online tools!' });
              onNavigate('tools');
            }}
            className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl border border-neutral-200/90 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Start Free
          </button>
        </div>

        <div className="mb-8">
          <PlanToggle isYearly={isYearly} onChange={setIsYearly} />
        </div>

        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 mb-8">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-sm font-bold text-[#0F0A1E] capitalize">{planType} Plan</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#0F0A1E]">${price}</span>
              <span className="text-xs text-neutral-400 font-bold">/user/mo</span>
            </div>
          </div>
          
          <ul className="space-y-3 pt-4 border-t border-neutral-200/60">
            {planType === 'teams' ? (
              [
                "Everything in PRO",
                "Up to 5 seat licenses",
                "Priority operations & files up to 1GB",
                "Direct admin controls",
                "No watermarks on outputs"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 text-purple-600 shrink-0" />
                  <span className="text-sm font-medium text-neutral-600">{feature}</span>
                </li>
              ))
            ) : (
              [
                "Access to all PRO tools",
                "File uploads up to 500MB",
                "Priority server processing",
                "Unlimited daily operations",
                "No watermarks on outputs"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 text-purple-600 shrink-0" />
                  <span className="text-sm font-medium text-neutral-600">{feature}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* PayPal button */}
        <div className="mb-4">
          <Suspense fallback={<div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />}>
            {(!import.meta.env.VITE_TURNSTILE_SITE_KEY || turnstileToken) ? (
              <PayPalButton isYearly={isYearly} planType={planType} />
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-sm font-bold text-neutral-500 mb-3 text-center">Please complete the captcha to checkout securely.</p>
                <div className="bg-neutral-50 rounded-xl p-2 border border-neutral-100">
                  {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                    <Turnstile
                      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                      onSuccess={(token) => setTurnstileToken(token)}
                    />
                  )}
                </div>
              </div>
            )}
          </Suspense>
        </div>

        {/* Coming soon payment methods */}
        <div className="mt-6 border-t border-neutral-100 pt-6">
          <p className="text-xs font-bold text-neutral-400 text-center uppercase tracking-wider mb-4">More payment methods coming soon</p>
          <div className="flex gap-3 justify-center opacity-40">
            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-500 rounded-lg text-xs font-bold">Apple Pay</span>
            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-500 rounded-lg text-xs font-bold">Google Pay</span>
            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-500 rounded-lg text-xs font-bold">Stripe</span>
          </div>
        </div>

        {/* Security note */}
        <p className="text-xs text-center font-semibold text-neutral-400 mt-6">
          🔒 Secure payment via PayPal · Cancel anytime
        </p>
      </div>
    </div>
  );
}
