import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// Wraps a section and fades/slides it in the first time it scrolls into view.
// Built on Framer Motion; honors prefers-reduced-motion (renders at rest).
export default function Reveal({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28, filter: "blur(8px)" }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-12% 0px" }}
    >
      {children}
    </motion.div>
  );
}
