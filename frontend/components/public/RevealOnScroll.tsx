"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "left" | "right";
  distance?: number;
  duration?: number;
  amount?: number;
  scale?: number;
};

export function RevealOnScroll({
  children,
  className,
  delayMs = 0,
  direction = "up",
  distance = 60,
  duration = 0.85,
  amount = 0.16,
  scale = 0.95,
}: RevealOnScrollProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { amount, margin: "0px 0px -10% 0px", initial: true });

  const hiddenState =
    direction === "left"
      ? { opacity: 0, x: -distance, y: 0, scale }
      : direction === "right"
        ? { opacity: 0, x: distance, y: 0, scale }
        : { opacity: 0, x: 0, y: distance, scale };
  const visibleState = { opacity: 1, x: 0, y: 0, scale: 1 };

  return (
    <motion.div
      ref={ref}
      className={cn("will-change-transform", className)}
      data-reveal-container="true"
      data-reveal-inview={shouldReduceMotion || isInView ? "true" : "false"}
      initial={false}
      animate={shouldReduceMotion || isInView ? visibleState : hiddenState}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay: delayMs / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
