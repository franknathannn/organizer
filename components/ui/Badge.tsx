import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: "urgent" | "soon" | "later" | "done" | "muted";
  className?: string;
}) {
  const toneClass = {
    urgent: "bg-urgent/10 text-urgent border-urgent/30",
    soon: "bg-soon/10 text-soon border-soon/30",
    later: "bg-later/10 text-later border-later/30",
    done: "bg-done/10 text-done border-done/30",
    muted: "bg-muted/10 text-muted border-muted/20",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide",
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}
