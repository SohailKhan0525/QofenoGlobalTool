// src/components/animations/FadeIn.tsx
// Lightweight scroll-triggered fade — no GSAP, no Framer, just CSS + IntersectionObserver
import React, { useEffect, useRef } from "react"

export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  translateY = 20,
  className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Set initial state via JS
    el.style.opacity = "0"
    el.style.transform = `translateY(${translateY}px)`
    el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`
    el.style.transitionDelay = `${delay}ms`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, duration, translateY])

  return <div ref={ref} className={className}>{children}</div>
}
