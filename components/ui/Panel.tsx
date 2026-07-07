import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Panel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-panel/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div>
        {eyebrow && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-lg text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}
