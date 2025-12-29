"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "@/lib/framer-motion";
import { useEffect } from "react";

export interface PulseStatProps {
  value: number;
  suffix?: string;
  label: string;
  gradient?: [string, string];
}

export function PulseStat({ value, suffix = "", label, gradient = ["#53F6FF", "#6C4DFF"] }: PulseStatProps) {
  const prefersReduced = useReducedMotion();
  const spring = useSpring(0, { stiffness: 60, damping: 15 });
  const display = useTransform(spring, latest => `${Math.round(latest)}${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.div
      className="relative rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
      animate={prefersReduced ? undefined : { boxShadow: [
        "0 0 0 rgba(83,246,255,0.3)",
        "0 0 35px rgba(108,77,255,0.6)",
        "0 0 0 rgba(83,246,255,0.3)"
      ] }}
      transition={{ duration: 12, repeat: Infinity }}
    >
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        }}
      >
        <span aria-hidden className="text-2xl font-semibold">✶</span>
      </div>
      <motion.span className="block text-4xl font-semibold" aria-live="polite">
        {display}
      </motion.span>
      <p className="mt-2 text-sm uppercase tracking-[0.3em] text-slate-600 dark:text-white/70">{label}</p>
    </motion.div>
  );
}

export default PulseStat;
