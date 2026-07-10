"use client";

import { cn, getAchievementClasses } from "@/lib/utils";

interface BarChartItem {
  label: string;
  value: number;
  maxValue?: number;
}

interface BarChartProps {
  items: BarChartItem[];
  maxValue?: number;
  className?: string;
  showValue?: boolean;
  colorByValue?: boolean;
  valueFormatter?: (value: number) => React.ReactNode;
}

export function BarChart({
  items,
  maxValue: propMax,
  className,
  showValue = true,
  colorByValue = false,
  valueFormatter,
}: BarChartProps) {
  const maxValue = propMax || Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const widthPercent = Math.min((item.value / maxValue) * 100, 100);
        const colors = colorByValue
          ? getAchievementClasses(item.value)
          : null;

        return (
          <div key={item.label} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-foreground-secondary truncate mr-3">
                {item.label}
              </span>
              {showValue && (
                <span
                  className={cn(
                    "text-sm font-mono font-medium tabular-nums",
                    colors ? colors.text : "text-accent-blue"
                  )}
                >
                  {valueFormatter ? valueFormatter(item.value) : item.value}
                </span>
              )}
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${widthPercent}%`,
                  background: colorByValue
                    ? undefined
                    : `linear-gradient(90deg, var(--accent-blue), var(--accent-violet))`,
                  backgroundColor: colors?.text
                    ? `var(--accent-${item.value >= 90 ? "emerald" : item.value >= 80 ? "amber" : "rose"})`
                    : undefined,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
