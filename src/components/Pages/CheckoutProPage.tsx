import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faCircleCheck, faBolt, faHardDrive, faClock, faCloudArrowDown } from '@fortawesome/free-solid-svg-icons';
import { PayPalButton } from '../PayPal/PayPalButton';
import { SEO } from '../SEO';
import { Turnstile } from '@marsidev/react-turnstile';
import { PlanToggle } from '../PlanToggle';

const PRO_FEATURES = [
  { icon: faBolt, text: 'Access to all PRO PDF & Document Tools' },
  { icon: faHardDrive, text: 'File uploads up to 500MB (vs 50MB free)' },
  { icon: faClock, text: 'Priority server processing' },
  { icon: faCloudArrowDown, text: 'Unlimited daily operations' },
  { icon: faCircleCheck, text: 'No watermarks on outputs' },
  { icon: faCircleCheck, text: 'Save processing history locally & synced' },
];

const TEAMS_FEATURES = [
  { icon: faBolt, text: 'Everything in PRO included' },
  { icon: faHardDrive, text: 'Up to 5 seat licenses for team members' },
  { icon: faClock, text: 'Large file uploads up to 1GB per session' },
  { icon: faCloudArrowDown, text: 'Shared team logs & operation history' },
  { icon: faCircleCheck, text: 'Custom templates & workflow configurations' },
  { icon: faCircleCheck, text: 'Priority 24/7 developer assistance' },
];

export function CheckoutProPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [planType, setPlanType] = useState<'pro' | 'teams'>('pro');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan') || 'pro';
    setPlanType(plan.toLowerCase() === 'teams' ? 'teams' : 'pro');
  }, []);

  const isTeams = planType === 'teams';
  const monthlyPrice = isTeams ? 19 : 9;
  const yearlyMonthlyPrice = isTeams ? 12 : 5.4;
  const savings = Math.round((1 - yearlyMonthlyPrice / monthlyPrice) * 100);

  const features = isTeams ? TEAMS_FEATURES : PRO_FEATURES;
  const titleText = isTeams ? 'Teams' : 'PRO';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0A1E] via-[#1a0f3a] to-[#0F0A1E] pt-28 pb-24 px-4 select-none font-medium">
      <SEO title={`Upgrade to ${titleText} — Qofeno`} description={`Unlock unlimited access to Qofeno ${titleText}. Convert, protect, watermark and more.`} />

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faShieldHalved} className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-black text-white">Upgrade to <span className="text-purple-400">{titleText}</span></h1>
          <p className="text-neutral-400 mt-2 text-lg">Unlock the full power of Qofeno.</p>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center mb-8 bg-white/5 border border-white/10 rounded-full p-1.5 inline-flex mx-auto w-full max-w-[280px]">
          <PlanToggle isYearly={isYearly} onChange={setIsYearly} />
        </div>

        {/* Price Display */}
        <div className="text-center mb-8">
          <div className="text-5xl font-black text-white">
            ${isYearly ? yearlyMonthlyPrice.toFixed(2) : monthlyPrice.toFixed(2)}
            <span className="text-xl text-neutral-400 font-normal">/mo</span>
          </div>
          {isYearly && (
            <p className="text-neutral-400 text-sm mt-1">Billed annually · ${(yearlyMonthlyPrice * 12).toFixed(0)}/year</p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
          {/* Features */}
          <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{titleText} Plan Includes:</h3>
          <ul className="space-y-3 mb-6">
            {features.map(({ icon: Icon, text }, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <FontAwesomeIcon icon={Icon} className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-300">{text}</span>
              </li>
            ))}
          </ul>

          {/* PayPal Button */}
          {(!import.meta.env.VITE_TURNSTILE_SITE_KEY || turnstileToken) ? (
            <PayPalButton isYearly={isYearly} planType={planType} />
          ) : (
            <div className="flex flex-col items-center">
              <p className="text-sm text-neutral-400 mb-3 text-center">Please complete the captcha to checkout securely.</p>
              <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                    onSuccess={(token) => setTurnstileToken(token)}
                    options={{ theme: 'dark' }}
                  />
                )}
              </div>
            </div>
          )}
  
        </div>

        {/* Coming Soon */}
        <div className="border border-white/10 rounded-2xl p-4">
          <p className="text-xs font-bold text-neutral-500 text-center uppercase tracking-wider mb-3">More payment methods coming soon</p>
          <div className="flex gap-2 justify-center">
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-neutral-500 rounded-lg text-xs font-bold">Apple Pay</span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-neutral-500 rounded-lg text-xs font-bold">Google Pay</span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-neutral-500 rounded-lg text-xs font-bold">Stripe</span>
          </div>
        </div>

        {/* Security */}
        <p className="text-xs text-center font-medium text-neutral-500 mt-6">
          🔒 Secure payment via PayPal · Cancel anytime · No hidden fees
        </p>
      </div>
    </div>
  );
}
