import { ReactLenis } from 'lenis/react';
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Refresh ScrollTrigger when Lenis scrolls
    ScrollTrigger.refresh();
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: false } as any}>
      <div className="bg-white text-neutral-900 min-h-screen overflow-hidden selection:bg-neutral-900 selection:text-white">
        {children}
      </div>
    </ReactLenis>
  );
}
