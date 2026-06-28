"use client";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "./variants";

export function StaggerGroup({ children, className = "", style }) {
  return (
    <motion.div className={className} style={style} variants={staggerContainer} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "", style }) {
  return (
    <motion.div className={className} style={style} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
