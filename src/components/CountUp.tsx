import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

// Tweens a number from 0 → value the first time it scrolls into view.
export default function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.2,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const hasRun = useRef(false);
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    // Count up once when first revealed; afterwards track the value directly
    // (so live recalculation, e.g. moving a slider, doesn't restart from 0).
    if (!inView || reduce || hasRun.current) {
      setDisplay(value);
      return;
    }
    hasRun.current = true;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
