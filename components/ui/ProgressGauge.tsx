"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProgressGauge({
  label,
  current,
  target,
  className,
}: {
  label: string;
  current: number;
  target: number;
  className?: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className={cn("group", className)}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-body text-sm text-ink truncate pr-2">{label}</span>
        <span className="font-mono text-xs text-amber tabular-nums">
          {current}/{target} · {pct}%
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-base/80 border border-border overflow-hidden relative">
        {/* faint tick marks, like a hardware gauge */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0, transparent 9%, rgba(255,255,255,0.08) 9%, rgba(255,255,255,0.08) 10%)",
          }}
        />
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 dark:from-white/80 dark:to-white shadow-sm"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
