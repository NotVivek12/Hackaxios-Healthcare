"use client";
/// <reference types="react" />

import React from "react";
import { motion, useReducedMotion, useTime, useTransform } from "@/lib/framer-motion";
import clsx from "clsx";

export type AuroraBackgroundProps = {
  className?: string;
  intensity?: number; // 0-1 controls opacity/blur strength
  children?: React.ReactNode;
};

// Aurora-like animated background with motion-safe fallback
// - Uses GPU-friendly radial gradients
// - Honors prefers-reduced-motion
// - Keeps contrast and avoids over-brightness
export function AuroraBackground({ className, intensity = 0.7, children }: AuroraBackgroundProps) {
  const shouldReduce = useReducedMotion();
  const time = useTime();

  // Gentle oscillations for gradient positions
  const x = useTransform(time, [0, 8000], [0, 200]);
  const y = useTransform(time, [0, 10000], [0, -200]);

  return (
    <div
      className={clsx(
        "relative h-full w-full",
        "bg-slate-50 dark:bg-slate-950",
        className
      )}
      aria-hidden={children ? undefined : true}
    >
      {/* Static fallback layer for reduced motion */}
      <div
        className={clsx(
          "absolute inset-0 pointer-events-none",
          "[mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]"
        )}
        style={{
          background:
            "radial-gradient(1200px 800px at 10% 30%, rgba(59,130,246,0.15), transparent)," +
            "radial-gradient(1000px 700px at 80% 70%, rgba(168,85,247,0.14), transparent)," +
            "radial-gradient(900px 600px at 50% 50%, rgba(16,185,129,0.12), transparent)",
          filter: `blur(${Math.round(28 * intensity)}px) saturate(110%)`,
        }}
      />

      {/* Animated glows overlaid; hidden if reduced motion */}
      {!shouldReduce && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: Math.min(Math.max(intensity, 0.2), 0.9),
          }}
        >
          <motion.div
            className="absolute -inset-1"
            style={{
              background:
                "radial-gradient(700px 500px at 20% 40%, rgba(59,130,246,0.25), transparent)," +
                "radial-gradient(800px 600px at 75% 60%, rgba(168,85,247,0.2), transparent)," +
                "radial-gradient(900px 600px at 50% 50%, rgba(99,102,241,0.16), transparent)",
              filter: `blur(${Math.round(36 * intensity)}px) saturate(120%)`,
            }}
            animate={{ opacity: [0.7, 1, 0.8] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Slow drifting highlight using translation */}
          <motion.div
            className="absolute left-1/3 top-1/3 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ x, y, filter: `blur(${Math.round(40 * intensity)}px)` }}
          >
            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(236,72,153,0.18), rgba(236,72,153,0.0))",
              }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Content slot */}
      {children && (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );
}

export default AuroraBackground;
