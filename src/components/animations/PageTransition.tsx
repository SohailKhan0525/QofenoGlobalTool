// src/components/animations/PageTransition.tsx
// Use Framer Motion for page transitions
import React from "react"
import { motion } from "framer-motion"

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
      exit={{    opacity: 0, y: -8, filter: "blur(3px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
