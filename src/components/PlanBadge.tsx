import React from 'react';

export function PlanBadge({ plan, className = '' }: { plan: string; className?: string }) {
  if (plan === 'teams') return (
    <span className={`px-2.5 py-0.5 bg-purple-900 text-purple-100 text-xs font-bold rounded-full shadow-xs ${className}`}>
      TEAMS ✦
    </span>
  );
  if (plan === 'pro') return (
    <span className={`px-2.5 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full shadow-xs ${className}`}>
      PRO ✦
    </span>
  );
  return (
    <span className={`px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs font-semibold rounded-full ${className}`}>
      FREE
    </span>
  );
}
