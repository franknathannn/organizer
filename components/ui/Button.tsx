import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-amber text-base hover:bg-amber/90 active:bg-amber/80",
        variant === "ghost" &&
          "bg-transparent border border-border text-ink hover:border-border-bright hover:bg-panel-raised",
        variant === "danger" &&
          "bg-transparent border border-danger/40 text-danger hover:bg-danger/10",
        className
      )}
      {...props}
    />
  );
}
