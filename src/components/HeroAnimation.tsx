// src/components/HeroAnimation.tsx
import React, { useEffect, useRef } from "react"

export function HeroAnimation({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load GSAP dynamically when hero mounts
    import("gsap").then(({ default: gsap }) => {
      const els = ref.current?.querySelectorAll("[data-hero]")
      if (!els?.length) return

      gsap.fromTo(
        els,
        { opacity: 0, y: 24, filter: "blur(4px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)",
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "filter,willChange"
        }
      )
    })
  }, [])

  return <div ref={ref}>{children}</div>
}
