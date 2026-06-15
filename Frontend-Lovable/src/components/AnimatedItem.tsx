import { useRef, type ReactNode } from "react";
import { motion, useInView } from "motion/react";

interface Props {
  children: ReactNode;
  index: number;
}

export function AnimatedItem({ children, index }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2, once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.35, delay: (index % 3) * 0.08 }}
    >
      {children}
    </motion.div>
  );
}