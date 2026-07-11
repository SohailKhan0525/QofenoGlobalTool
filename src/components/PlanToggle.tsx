import React from 'react';
import { cn } from '../lib/utils';

interface PlanToggleProps {
  isYearly: boolean;
  onChange: (val: boolean) => void;
}

export function PlanToggle({ isYearly, onChange }: PlanToggleProps) {
  return (
    <div className="flex items-center gap-4 bg-purple-50/80 border border-purple-100 rounded-full p-1.5 relative inline-flex select-none">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer z-10",
          !isYearly 
            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
            : "text-neutral-550 hover:text-neutral-800"
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer z-10 flex items-center gap-1",
          isYearly 
            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
            : "text-neutral-550 hover:text-neutral-800"
        )}
      >
        Yearly
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all",
          isYearly 
            ? "bg-white/20 text-white border border-white/10" 
            : "bg-green-100 text-green-700 border border-green-200"
        )}>
          -40%
        </span>
      </button>
    </div>
  );
}
