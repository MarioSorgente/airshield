import { motion, useScroll, useSpring } from "framer-motion";

// Thin teal progress bar pinned to the very top, tracking scroll position.
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-[60] h-0.5 origin-left bg-[#00D4AA]"
    />
  );
}
