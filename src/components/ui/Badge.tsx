"use client";

import { cn, getAchievementClasses, formatPercent } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const BADGE_VARIANTS = {
  default: "bg-[var(--surface)] text-foreground-secondary ring-1 ring-[var(--border)]",
  success: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  warning: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
  danger: "bg-rose-400/10 text-rose-400 ring-1 ring-rose-400/20",
  info: "bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20",
};

export function Badge({ children, variant = "default", className, ...props }: BadgeProps) {
  return (
    <span className={cn("badge", BADGE_VARIANTS[variant], className)} {...props}>
      {children}
    </span>
  );
}

/** Badge that auto-colors based on an achievement percentage */
export function AchievementBadge({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const colors = getAchievementClasses(value);

  return (
    <span
      className={cn(
        "badge ring-1 font-mono tabular-nums",
        colors.bg,
        colors.text,
        colors.ring,
        className
      )}
    >
      {formatPercent(value)}
    </span>
  );
}
