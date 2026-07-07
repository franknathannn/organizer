import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-border-bright focus:outline-none focus:ring-1 focus:ring-border-bright transition-all",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-border-bright focus:outline-none focus:ring-1 focus:ring-border-bright resize-none transition-all",
        className
      )}
      {...props}
    />
  );
}
