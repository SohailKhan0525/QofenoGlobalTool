import React from 'react';

export function PlanBadge({ plan, className = '' }: { plan: string; className?: string }) {
  const icon = (
    <svg viewBox="0 0 228 216" className="w-3 h-3 fill-current shrink-0">
      <path d="M 119 180 A 65.9 65.9 0 1 1 155 151.5 L 143 141 A 49.2 49.2 0 1 0 108 166 Z" />
      <path d="M 97 134 L 118 134 L 165 183 L 143.5 182.5 Z" />
    </svg>
  );

  if (plan === 'teams') return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-900 text-purple-100 text-xs font-bold rounded-full shadow-xs ${className}`}>
      {icon} TEAMS
    </span>
  );
  if (plan === 'pro') return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-xs ${className}`}>
      {icon} PRO
    </span>
  );
  return (
    <span className={`px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs font-semibold rounded-full ${className}`}>
      FREE
    </span>
  );
}
