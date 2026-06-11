import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PayPalButton } from '../PayPal/PayPalButton';
import { SEO } from '../SEO';

export function CheckoutProPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 px-4 select-none">
      <SEO title="Upgrade to PRO" description="Unlock unlimited access to all PDF tools." />
      
      <div className="max-w-lg mx-auto p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-black text-[#0F0A1E]">Upgrade to Pro</h1>
          <p className="text-neutral-500 mt-2">Unlock the full potential of Qofeno.</p>
        </div>

        {/* Plan toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={\`text-sm font-bold \${!isYearly ? 'text-[#0F0A1E]' : 'text-neutral-400'}\`}>Monthly ($9)</span>
          <button 
            onClick={() => setIsYearly(!isYearly)}
            className="w-12 h-6 rounded-full bg-purple-600 relative transition-colors duration-300"
          >
            <div className={\`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 \${isYearly ? 'translate-x-7' : 'translate-x-1'}\`} />
          </button>
          <span className={\`text-sm font-bold \${isYearly ? 'text-[#0F0A1E]' : 'text-neutral-400'}\`}>Yearly ($5.40/mo)</span>
        </div>

        {/* What you get */}
        <div className="bg-neutral-50 rounded-2xl p-6 mb-8 border border-neutral-100">
          <h3 className="font-bold text-[#0F0A1E] mb-4">Pro Plan Includes:</h3>
          <ul className="space-y-3">
            {[
              "Access to all 18+ PRO PDF Tools",
              "File uploads up to 500MB",
              "Priority server processing",
              "Unlimited daily operations",
              "No watermarks on outputs"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm font-medium text-neutral-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* PayPal button */}
        <PayPalButton />

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
