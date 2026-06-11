import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Zap, HardDrive, Clock, DownloadCloud } from 'lucide-react';
import { PayPalButton } from '../PayPal/PayPalButton';
import { SEO } from '../SEO';

const PRO_FEATURES = [
  { icon: Zap, text: 'Access to all 18+ PRO PDF Tools' },
  { icon: HardDrive, text: 'File uploads up to 500MB (vs 50MB free)' },
  { icon: Clock, text: 'Priority server processing' },
  { icon: DownloadCloud, text: 'Unlimited daily operations' },
  { icon: CheckCircle2, text: 'No watermarks on outputs' },
  { icon: CheckCircle2, text: 'PDF OCR, Protect, Redact, Watermark & more' },
];

export function CheckoutProPage() {
  const [isYearly, setIsYearly] = useState(false);

  const monthlyPrice = 9;
  const yearlyMonthlyPrice = 5.4;
  const savings = Math.round((1 - yearlyMonthlyPrice / monthlyPrice) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0A1E] via-[#1a0f3a] to-[#0F0A1E] pt-28 pb-24 px-4 select-none">
      <SEO title="Upgrade to PRO — Qofeno" description="Unlock unlimited access to all PDF tools with Qofeno PRO. Convert, protect, watermark and more." />

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-black text-white">Upgrade to <span className="text-purple-400">PRO</span></h1>
          <p className="text-neutral-400 mt-2 text-lg">Unlock the full power of Qofeno's PDF suite.</p>
        </div>

        {/* Plan Toggle */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex mb-8 relative">
          <button
            onClick={() => setIsYearly(false)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isYearly ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-neutral-400 hover:text-white'}`}
          >
            Monthly · ${monthlyPrice}/mo
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isYearly ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-neutral-400 hover:text-white'}`}
          >
            Yearly · ${yearlyMonthlyPrice}/mo
            <span className="ml-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
              Save {savings}%
            </span>
          </button>
        </div>

        {/* Price Display */}
        <div className="text-center mb-8">
          <div className="text-5xl font-black text-white">
            ${isYearly ? yearlyMonthlyPrice : monthlyPrice}
            <span className="text-xl text-neutral-400 font-normal">/mo</span>
          </div>
          {isYearly && (
            <p className="text-neutral-400 text-sm mt-1">Billed annually · ${(yearlyMonthlyPrice * 12).toFixed(0)}/year</p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
          {/* Features */}
          <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">PRO Plan Includes:</h3>
          <ul className="space-y-3 mb-6">
            {PRO_FEATURES.map(({ icon: Icon, text }, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-neutral-300">{text}</span>
              </li>
            ))}
          </ul>

          {/* PayPal Button */}
          <PayPalButton isYearly={isYearly} />
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
