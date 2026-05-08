"use client";

import { animate, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

const defaultStatFormat = (n: number) => String(Math.round(n));

function sparklinePoints(value: number, seed: number): string {
  const n = 14;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const wave = Math.sin(t * Math.PI * 2 + seed * 0.4) * 0.22;
    const bias = (value % 17) / 100;
    const y = 0.55 + wave * (0.35 + bias) - t * 0.08;
    const x = t;
    pts.push(`${x * 100},${(1 - Math.min(0.92, Math.max(0.08, y))) * 100}`);
  }
  return pts.join(" ");
}

function MiniSparkline({ value }: { value: number }) {
  const reactId = useId();
  const gradId = `spark-${reactId.replace(/:/g, "")}`;
  const seed = useMemo(() => Math.abs(Math.floor(value * 13)) % 7, [value]);
  const points = useMemo(() => sparklinePoints(value, seed), [value, seed]);

  return (
    <motion.svg
      viewBox="0 0 100 36"
      className="h-9 w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(167, 139, 250)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="rgb(129, 140, 248)" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </motion.svg>
  );
}

function AnimatedStatValue({
  value,
  format
}: {
  value: number;
  format: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const ctrl = animate(0, value, {
      duration: 1.35,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        if (el) el.textContent = format(latest);
      }
    });
    return () => ctrl.stop();
  }, [value, format]);

  return (
    <span ref={ref} className="font-display text-3xl font-bold tabular-nums text-white">
      {format(0)}
    </span>
  );
}

export function StatsCard({
  title,
  value,
  format = defaultStatFormat,
  hint,
  icon: Icon,
  progress,
  className
}: {
  title: string;
  value: number;
  format?: (n: number) => string;
  hint?: string;
  icon: LucideIcon;
  progress: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.06] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        "transition-shadow duration-300 hover:border-violet-400/25 hover:shadow-[0_16px_48px_rgba(139,92,246,0.18)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.07] via-transparent to-indigo-600/[0.05] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/45">{title}</p>
          <div className="mt-2">
            <AnimatedStatValue value={value} format={format} />
          </div>
          {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
        </div>
        <motion.span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-violet-200 shadow-inner"
          )}
          whileHover={{ scale: 1.06, rotate: 4 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <Icon className="size-5 text-violet-300" aria-hidden />
        </motion.span>
      </div>

      <div className="relative mt-4 space-y-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-400"
            initial={{ width: 0 }}
            whileInView={{ width: `${clamped}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </div>
        <MiniSparkline value={value} />
      </div>
    </motion.div>
  );
}
