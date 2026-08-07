import React from 'react';

interface QofenoLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClass?: string;
}

export function QofenoLogo({ size = 36, showText = true, className = '' }: QofenoLogoProps) {
  if (showText) {
    return (
      <div className={`flex items-center select-none ${className}`}>
        <img
          src="/qofeno_full.svg"
          alt="Qofeno"
          style={{ height: size }}
          className="w-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <img
        src="/favicon.svg"
        alt="Qofeno"
        style={{ width: size, height: size }}
        className="object-contain"
      />
    </div>
  );
}
