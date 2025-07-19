"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"

export const ConfettiButton = ({ onClick, children, className }) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    setIsAnimating(true)

    // Trigger confetti
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 5000,
    }

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ["#f1c40f", "#ffffff"],
    })
    fire(0.2, {
      spread: 60,
      colors: ["#f1c40f"],
    })
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ["#ffffff"],
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ["#f1c40f", "#ffffff"],
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ["#ffffff"],
    })

    // Call the original onClick handler if provided
    if (onClick) onClick()

    // Reset animation state after a delay
    setTimeout(() => setIsAnimating(false), 1000)
  }

  return (
    <motion.button
      className={className}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={
        isAnimating
          ? {
              scale: [1, 1.2, 1],
              rotate: [0, 15, -15, 0],
            }
          : {}
      }
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.button>
  )
}
