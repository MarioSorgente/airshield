import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// Wraps a section and fades/slides it gently in the first time it scrolls into
// view. Subtle on purpose (small lift, no blur) so chapters settle rather than
// pop. Built on Framer Motion; honors prefers-reduced-motion (renders at rest).
export default function Reveal({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-10% 0px" }}
    >
      {children}
    </motion.div>
  );
}
