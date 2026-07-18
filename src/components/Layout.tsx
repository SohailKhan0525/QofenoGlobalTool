import React, { useEffect } from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isMobileOrTouch = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobileOrTouch) return;

    let lenis: any;
    let animFrame: number;

    // Load Lenis dynamically
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      function raf(time: number) {
        lenis.raf(time);
        animFrame = requestAnimationFrame(raf);
      }
      animFrame = requestAnimationFrame(raf);

      // Load GSAP ScrollTrigger dynamically
      import('gsap').then(({ default: gsap }) => {
        import('gsap/ScrollTrigger').then(({ default: ScrollTrigger }) => {
          gsap.registerPlugin(ScrollTrigger);
          lenis.on('scroll', () => ScrollTrigger.update());
          ScrollTrigger.refresh();
        });
      });
    });

    return () => {
      if (lenis) {
        lenis.destroy();
      }
      if (animFrame) {
        cancelAnimationFrame(animFrame);
      }
    };
  }, []);

  return (
    <div className="bg-white text-neutral-900 min-h-screen overflow-hidden selection:bg-neutral-900 selection:text-white">
      {children}
    </div>
  );
}
