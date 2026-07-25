// src/components/animations/ProcessingRing.tsx
// CSS-only animated ring — no JS animation during processing
import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGear } from "@fortawesome/free-solid-svg-icons"

export function ProcessingRing({ size = 64 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer track */}
      <div
        className="absolute inset-0 rounded-full border-4 border-purple-100"
      />
      {/* Spinning arc */}
      <div
        className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"
      />
      {/* Inner icon */}
      <div className="relative z-10 w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
        <FontAwesomeIcon
          icon={faGear}
          className="text-purple-500 text-sm animate-spin"
          style={{ animationDirection: "reverse" }}
        />
      </div>
    </div>
  )
}
