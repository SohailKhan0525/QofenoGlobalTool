import React from 'react';

interface QofenoLogoProps {
  size?: number;
  showText?: boolean;
}

export function QofenoLogo({ size = 40, showText = true }: QofenoLogoProps) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img
        src="/qofeno.png"
        alt="Qofeno"
        width={size}
        height={size}
        className="rounded-lg object-contain"
        loading="eager"
      />
      {showText && (
        <span className="font-display font-black text-xl text-purple-700 tracking-tight">Qofeno</span>
      )}
    </div>
  );
}
