"use client";
import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

// Smoothly counts up to `value` when scrolled into view.
export default function AnimatedNumber({ value = 0, duration = 1.1, format = (n) => Math.round(n).toLocaleString() }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return <span ref={ref}>{format(display)}</span>;
}
