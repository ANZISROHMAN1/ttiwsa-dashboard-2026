"use client";

import { cn, getAchievementClasses, formatPercent } from "@/lib/utils";

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: "blue" | "emerald" | "amber" | "rose" | "violet";
  children?: React.ReactNode;
  className?: string;
}

export function Card({
  title,
  value,
  subtitle,
  icon,
  gradient = "blue",
  children,
  className,
}: CardProps) {
  const gradientClass = `gradient-${gradient}`;

  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      <div className={cn("p-6", gradientClass)}>
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
            {title}
          </span>
          {icon && (
            <div className="w-9 h-9 rounded-lg bg-[var(--surface)] flex items-center justify-center text-foreground-muted">
              {icon}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground mb-1">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-foreground-muted">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}

/** Card variant specifically for KPI metrics with achievement */
interface MetricCardProps {
  title: string;
  achievement: number;
  comply?: number;
  notComply?: number;
  target?: number;
  totalPS?: number;
  totalTicket?: number;
  gradient?: "blue" | "emerald" | "amber" | "rose" | "violet";
}

export function MetricCard({
  title,
  achievement,
  comply,
  notComply,
  target,
  totalPS,
  totalTicket,
  gradient = "blue",
}: MetricCardProps) {
  const colors = getAchievementClasses(achievement);

  return (
    <Card
      title={title}
      value={formatPercent(achievement)}
      gradient={gradient}
      icon={
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      }
    >
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "badge ring-1",
            colors.bg,
            colors.text,
            colors.ring
          )}
        >
          {achievement >= 90 ? "On Target" : achievement >= 80 ? "Warning" : "Below Target"}
        </span>
        {target != null && (
          <span className="text-xs text-foreground-muted">
            Target: {formatPercent(target)}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        {comply != null && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-foreground-muted">
              Comply: <span className="text-foreground font-medium">{comply}</span>
            </span>
          </div>
        )}
        {notComply != null && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-foreground-muted">
              Not Comply: <span className="text-foreground font-medium">{notComply}</span>
            </span>
          </div>
        )}
        {totalPS != null && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-foreground-muted">
              PS: <span className="text-foreground font-medium">{totalPS}</span>
            </span>
          </div>
        )}
        {totalTicket != null && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-foreground-muted">
              Tickets: <span className="text-foreground font-medium">{totalTicket}</span>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
