import React from 'react';

interface QofenoLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function QofenoLogo({ size = 36, showText = true, className = '' }: QofenoLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Premium Gradient Icon Container with Vector Q Mark */}
      <div
        className="rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-fuchsia-500 p-2 text-white shadow-md shadow-purple-500/20 flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 228 216" className="w-full h-full fill-white">
          <path d="M 119 180 A 65.9 65.9 0 1 1 155 151.5 L 143 141 A 49.2 49.2 0 1 0 108 166 Z" />
          <path d="M 97 134 L 118 134 L 165 183 L 143.5 182.5 Z" />
        </svg>
      </div>

      {/* Gradient Typography */}
      {showText && (
        <span className="font-display font-black text-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent tracking-tight leading-none">
          Qofeno
        </span>
      )}
    </div>
  );
}
