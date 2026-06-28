"use client";
import { motion } from "framer-motion";
import { fadeSlideUp } from "./variants";

// Reveals content as it scrolls into view (once).
export default function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      variants={fadeSlideUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
