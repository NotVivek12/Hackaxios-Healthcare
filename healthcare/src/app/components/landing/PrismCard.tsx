"use client";

import { motion } from "@/lib/framer-motion";
import Link from "next/link";
import clsx from "clsx";
import React from "react";

export interface PrismCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  href?: string;
  footnote?: React.ReactNode;
  className?: string;
}

export function PrismCard({ title, description, icon, href, footnote, className }: PrismCardProps) {
  const content = (
    <motion.div
      whileHover={{ rotateX: -4, rotateY: 5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={clsx(
        "group relative rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_12px_40px_rgba(15,23,42,0.08)]",
        "backdrop-blur-xl hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]",
        "before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-slate-50 before:to-transparent before:opacity-0 before:transition before:duration-300 group-hover:before:opacity-100",
        "dark:border-white/10 dark:bg-white/5 dark:text-white dark:before:from-white/10",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg dark:bg-white/10">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">Feature</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
      </div>
      <p className="mt-4 text-slate-600 dark:text-white/80">{description}</p>
      {footnote && <div className="mt-6 text-sm text-slate-500 dark:text-white/70">{footnote}</div>}
      <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/40" />
      {href && (
        <span className="mt-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-slate-600 dark:text-white/70">
          Explore
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transition group-hover:translate-x-1">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block" aria-label={title}>
        {content}
      </Link>
    );
  }

  return content;
}

export default PrismCard;
