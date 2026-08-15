import { useEffect, useRef, useState } from "react";

export default function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  duration = 1200,
  decimals = 0,
  formatIndian = true,
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (value === undefined || value === null) return;
    const target = Number(value);
    if (isNaN(target)) return;

    startRef.current = performance.now();
    const startVal = 0;

    function animate(now) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * eased;
      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  function formatNumber(num) {
    if (formatIndian) {
      return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    }
    return num.toFixed(decimals);
  }

  return (
    <span>
      {prefix}
      {formatNumber(display)}
      {suffix}
    </span>
  );
}
