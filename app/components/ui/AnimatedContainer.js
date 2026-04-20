"use client";

import { motion } from "framer-motion";

/**
 * AnimatedContainer - A reusable wrapper for smooth animations.
 * 
 * @param {React.Node} children - Elements to animate
 * @param {string} type - type of animation ('fade', 'slideUp', 'stagger')
 * @param {number} delay - initial delay in seconds
 * @param {string} className - optional CSS class
 */
export default function AnimatedContainer({ 
  children, 
  type = "slideUp", 
  delay = 0, 
  className = "",
  stagger = 0.05
}) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.4, delay }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: "easeOut", delay }
    },
    staggerContainer: {
      initial: {},
      animate: {
        transition: {
          staggerChildren: stagger,
          delayChildren: delay
        }
      }
    },
    staggerItem: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 }
    }
  };

  if (type === "stagger") {
    return (
      <motion.div
        variants={variants.staggerContainer}
        initial="initial"
        animate="animate"
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  if (type === "staggerItem") {
     return (
      <motion.div
        variants={variants.staggerItem}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  const selected = variants[type] || variants.slideUp;

  return (
    <motion.div
      initial={selected.initial}
      animate={selected.animate}
      transition={selected.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
