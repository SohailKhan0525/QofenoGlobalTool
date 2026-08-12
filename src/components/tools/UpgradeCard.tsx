import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

interface UpgradeCardProps {
  toolName?: string;
  onUpgrade?: () => void;
}

export function UpgradeCard({ toolName = "Pro Tools", onUpgrade }: UpgradeCardProps) {
  return (
    <div className="sticky top-24 rounded-2xl border border-purple-100/80 bg-gradient-to-b from-purple-50/70 via-white to-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm shrink-0 p-1.5 text-white">
          <svg viewBox="0 0 228 216" className="w-full h-full fill-white">
            <path d="M 119 180 A 65.9 65.9 0 1 1 155 151.5 L 143 141 A 49.2 49.2 0 1 0 108 166 Z" />
            <path d="M 97 134 L 118 134 L 165 183 L 143.5 182.5 Z" />
          </svg>
        </div>
        <div>
          <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Pro Plan</span>
          <span className="text-[11px] text-neutral-400 font-medium">Unlimited Access</span>
        </div>
      </div>

      <h3 className="text-base font-bold text-neutral-900 mb-1 leading-snug">
        Unlock {toolName}
      </h3>
      <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
        Get full access to all pro tools, larger file sizes (up to 500MB), and production-grade cloud processing.
      </p>

      {/* Features list */}
      <ul className="space-y-2 mb-5">
        {[
          "All 500+ tools unlocked",
          "Files up to 500MB",
          "Priority cloud processing",
          "Ghostscript + LibreOffice quality",
        ].map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
            <FontAwesomeIcon icon={faCheck} className="text-purple-500 w-3.5 h-3.5 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          if (onUpgrade) {
            onUpgrade();
          } else {
            window.history.pushState({}, '', '/checkout/pro');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }}
        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/15 transition-all active:scale-[0.98] cursor-pointer"
      >
        Upgrade to Pro — $11/mo
      </button>
      <p className="text-[10px] text-center text-neutral-400 mt-2 font-medium">
        Cancel anytime · Instant activation
      </p>
    </div>
  );
}
