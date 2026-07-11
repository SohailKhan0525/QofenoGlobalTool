import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { PayPalButton } from '../PayPal/PayPalButton';
import { SEO } from '../../components/SEO';
import { motion } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';

export function Payment({ onNavigate }: { onNavigate: (page: string) => void }) {
  const params = new URLSearchParams(window.location.search);
  const planParam = (params.get('plan') || 'pro').toLowerCase();
  const planType = planParam === 'teams' ? 'teams' : 'pro';
  
  const [isYearly, setIsYearly] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const monthlyPrice = planType === 'teams' ? 19 : 9;
  const yearlyPrice = planType === 'teams' ? 12 : 5.40;
  const currentPrice = isYearly ? yearlyPrice : monthlyPrice;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 px-4 select-none relative overflow-hidden">
      <SEO title={`Upgrade to ${planType === 'teams' ? 'Teams' : 'PRO'}`} description={`Unlock unlimited access to all Qofeno ${planType === 'teams' ? 'Teams' : 'PRO'} tools.`} />
      
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-300/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-400/10 blur-[120px]" />
      </div>

      <motion.div 
        initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-lg mx-auto p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faShieldHalved} className="w-8 h-8 text-purple-650" />
          </div>
          <h1 className="text-3xl font-black text-[#0F0A1E]">Upgrade to {planType === 'teams' ? 'Teams' : 'Pro'}</h1>
          <p className="text-neutral-500 mt-2">Unlock the full potential of Qofeno.</p>
        </div>

        {/* Plan toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={"text-sm font-bold " + (!isYearly ? "text-[#0F0A1E]" : "text-neutral-400")}>Monthly (${monthlyPrice})</span>
          <button 
            type="button"
            onClick={() => setIsYearly(!isYearly)}
            className="w-12 h-6 rounded-full bg-purple-600 relative transition-colors duration-300 cursor-pointer"
          >
            <div className={"w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 " + (isYearly ? "translate-x-7" : "translate-x-1")} />
          </button>
          <span className={"text-sm font-bold " + (isYearly ? "text-[#0F0A1E]" : "text-neutral-400")}>Yearly (${yearlyPrice}/mo)</span>
        </div>

        {/* What you get */}
        <div className="bg-neutral-50 rounded-2xl p-6 mb-8 border border-neutral-100">
          <h3 className="font-bold text-[#0F0A1E] mb-4">{planType === 'teams' ? 'Teams' : 'Pro'} Plan Includes:</h3>
          <ul className="space-y-3">
            {planType === 'teams' ? (
              [
                "Everything in Pro",
                "Up to 5 team members",
                "Shared tool history",
                "Priority support",
                "Higher file size limits (1GB)",
                "Early access to new tools"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 text-green-500 shrink-0" />
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
                  <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm font-medium text-neutral-600">{feature}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* PayPal button */}
        <div className="mb-4">
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
      </motion.div>
    </div>
  );
}
