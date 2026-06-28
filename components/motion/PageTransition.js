"use client";
import { motion } from "framer-motion";
import { pageTransition } from "./variants";

// Wraps page content with a subtle fade + slide. Respects reduced motion via
// Framer's built-in MotionConfig handling at the provider level.
export default function PageTransition({ children, className = "" }) {
  return (
    <motion.div className={className} initial="initial" animate="animate" variants={pageTransition}>
      {children}
    </motion.div>
  );
}
