"use client"

import { motion } from "framer-motion"

interface SuccessPulseProps {
  trigger: boolean
  children: React.ReactNode
}

export function SuccessPulse({ trigger, children }: SuccessPulseProps) {
  return (
    <motion.div
      animate={trigger ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={trigger ? "animate-pulse-success rounded-ello" : ""}
    >
      {children}
    </motion.div>
  )
}
