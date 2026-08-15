"use client";
import { motion } from "framer-motion";

// Interactive card with a hover lift, animated shadow and a soft gradient
// border glow. Used by Phase 2 surfaces; Phase 1 Card stays untouched.
export default function MotionCard({
  children,
  className = "",
  padding = "p-5",
  onClick,
  interactive = true,
  glow = true,
  style = {},
}) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
      whileHover={interactive ? { y: -4, boxShadow: "0 18px 44px rgba(0,0,0,0.4)" } : undefined}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-xl ${padding} ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", ...style }}
    >
      {glow && interactive && (
        <span
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "linear-gradient(120deg, transparent, rgba(22,217,106,0.1), transparent)",
            maskImage: "linear-gradient(#000 0 0)",
          }}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
