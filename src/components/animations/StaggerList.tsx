// src/components/animations/StaggerList.tsx
// Staggers children with CSS delays — GPU-accelerated, no library needed
import React from "react"
import { FadeIn } from "./FadeIn"

export function StaggerList({
  children,
  staggerMs = 60,
  baseDelayMs = 0,
  className = ""
}: {
  children: React.ReactNode;
  staggerMs?: number;
  baseDelayMs?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => (
        <FadeIn key={i} delay={baseDelayMs + i * staggerMs}>
          {child}
        </FadeIn>
      ))}
    </div>
  )
}
