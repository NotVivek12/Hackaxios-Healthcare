"use client";

import React from "react";
import { motion, useReducedMotion } from "@/lib/framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";
import { Shield, Sparkles, Star } from "lucide-react";
import clsx from "clsx";

export type PortalHeroProps = {
  title: string;
  subtitle: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  className?: string;
};

export default function PortalHero(props: PortalHeroProps) {
  const {
    title,
    subtitle,
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
    className,
  } = props;

  const reduce = useReducedMotion();

  const container = reduce
    ? undefined
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: "easeOut" },
      } as const;

  return (
    <section
      className={clsx(
        "relative min-h-[78vh] flex items-center justify-center px-4 sm:px-6 lg:px-8",
        className
      )}
      aria-labelledby="portal-hero-heading"
    >
      {/* Decorative orbs - hidden from AT */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center text-slate-900 dark:text-white">
        <motion.div {...(container ?? {})}>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white/80">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            <span>HIPAA-grade privacy • End-to-end encrypted</span>
          </div>

          <h1 id="portal-hero-heading" className="mt-6 text-balance text-4xl font-bold tracking-tight md:text-6xl">
            <span className="bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-sky-100 dark:to-violet-200">
              {title}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600 md:text-xl dark:text-white/80">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="gradient" size="lg" glow animated asChild>
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              animated
              className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-white/30 dark:text-white/90 dark:hover:bg-white/10"
              asChild
            >
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </div>
        </motion.div>

        {/* Subtle floating badges */}
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 text-left sm:grid-cols-3">
          {[
            { icon: Sparkles, label: "AI Symptom Insights" },
            { icon: Star, label: "Trusted by Providers" },
            { icon: Shield, label: "Secure by Design" },
          ].map((b, i) => (
            <motion.div
              key={b.label}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/80"
              {...(reduce
                ? {}
                : {
                    initial: { opacity: 0, y: 10 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: "-50px" },
                    transition: { delay: 0.15 * i, duration: 0.5 },
                  })}
            >
              <b.icon className="h-4 w-4" aria-hidden />
              <span className="text-sm">{b.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
