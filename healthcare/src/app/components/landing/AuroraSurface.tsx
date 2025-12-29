"use client";

import clsx from "clsx";
import React from "react";

type AuroraVariant = "calm" | "pulse" | "ember";

const variantMap: Record<AuroraVariant, string> = {
  calm: "from-sky-500/30 via-violet-500/20 to-slate-900/60",
  pulse: "from-cyan-400/50 via-blue-500/30 to-purple-800/60",
  ember: "from-emerald-400/40 via-amber-400/30 to-rose-700/60",
};

export interface AuroraSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AuroraVariant;
  interactive?: boolean;
  children?: React.ReactNode;
}

export function AuroraSurface({
  variant = "calm",
  interactive = false,
  className,
  children,
  ...rest
}: AuroraSurfaceProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-[1px] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40",
        className
      )}
      {...rest}
    >
      <div
        className={clsx(
          "absolute inset-0 bg-gradient-to-br blur-3xl opacity-80",
          variantMap[variant]
        )}
        aria-hidden
      />
      <div className="relative rounded-[1.4rem] bg-white px-6 py-8 text-slate-900 shadow-xl dark:bg-slate-900/60 dark:text-white">
        {children}
      </div>
      {interactive && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl border border-white/5"
          style={{ boxShadow: "0 0 60px rgba(83,246,255,0.2)" }}
        />
      )}
    </div>
  );
}

export default AuroraSurface;
