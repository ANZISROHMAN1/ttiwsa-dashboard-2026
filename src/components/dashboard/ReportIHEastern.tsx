"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  DistrictData,
  ServiceAreaData,
  MetricSet,
  MetricData,
  MetricKey,
} from "@/types/report-ih-eastern";
import { METRIC_CONFIGS, getTrendColor } from "@/types/report-ih-eastern";

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Tiny colored dot that represents a trend */
function TrendDot({ trend }: { trend: string }) {
  const c = getTrendColor(trend);
  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full shrink-0", c.dot)}
      title={
        trend === "🟢"
          ? "Better than yesterday"
          : trend === "🔴"
          ? "Worse than yesterday"
          : "Similar to yesterday"
      }
    />
  );
}

/** A single metric pill used in the SA summary row */
function MetricPill({
  label,
  metric,
}: {
  label: string;
  metric: MetricData;
}) {
  const c = getTrendColor(metric.trend);
  const realDisplay =
    typeof metric.real === "number"
      ? metric.real % 1 === 0
        ? `${metric.real}%`
        : `${metric.real.toFixed(2)}%`
      : `${metric.real}%`;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all duration-200 min-w-[90px]",
        c.bg,
        c.border,
        "hover:scale-[1.03]"
      )}
    >
      <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider leading-none text-center">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <TrendDot trend={metric.trend} />
        <span className={cn("text-sm font-bold tabular-nums", c.text)}>
          {realDisplay}
        </span>
      </div>
    </div>
  );
}

/** Metric cell inside the STO table */
function MetricCell({ metric }: { metric: MetricData }) {
  const c = getTrendColor(metric.trend);
  const realDisplay =
    typeof metric.real === "number"
      ? metric.real % 1 === 0
        ? `${metric.real}%`
        : `${metric.real.toFixed(2)}%`
      : `${metric.real}%`;

  const hasDetail =
    metric.comply !== undefined || metric.notComply !== undefined;

  return (
    <td className="px-3 py-3 whitespace-nowrap">
      <div className="flex flex-col items-center gap-0.5 group relative">
        <div className="flex items-center gap-1.5">
          <TrendDot trend={metric.trend} />
          <span className={cn("text-sm font-semibold tabular-nums", c.text)}>
            {realDisplay}
          </span>
        </div>
        {/* Hover tooltip with extra detail */}
        {hasDetail && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 pointer-events-none">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-3 text-xs whitespace-nowrap space-y-1">
              {metric.comply !== undefined && (
                <div>
                  <span className="text-foreground-muted">Comply:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {metric.comply}
                  </span>
                </div>
              )}
              {metric.notComply !== undefined && (
                <div>
                  <span className="text-foreground-muted">Not Comply:</span>{" "}
                  <span className="font-semibold text-rose-400">
                    {metric.notComply}
                  </span>
                </div>
              )}
              {metric.tiketGgn !== undefined && (
                <div>
                  <span className="text-foreground-muted">Tiket Ggn:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {metric.tiketGgn}
                  </span>
                </div>
              )}
              {metric.thresholdNc !== undefined && (
                <div>
                  <span className="text-foreground-muted">Threshold NC:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {metric.thresholdNc}
                  </span>
                </div>
              )}
              {metric.dev !== undefined && (
                <div>
                  <span className="text-foreground-muted">Dev:</span>{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      metric.dev > 0
                        ? "text-emerald-400"
                        : metric.dev < 0
                        ? "text-rose-400"
                        : "text-foreground"
                    )}
                  >
                    {metric.dev > 0 ? `+${metric.dev}` : metric.dev}
                  </span>
                </div>
              )}
              <div className="border-t border-[var(--border)] pt-1 mt-1">
                <span className="text-foreground-muted">H-1:</span>{" "}
                <span className="font-semibold text-foreground">
                  {typeof metric.h1 === "number"
                    ? `${metric.h1.toFixed(2)}%`
                    : metric.h1}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </td>
  );
}

/** Expandable Service Area card */
function ServiceAreaCard({ sa }: { sa: ServiceAreaData }) {
  const [expanded, setExpanded] = useState(false);

  // Count how many metrics are red / yellow / green for the SA summary
  const trendCounts = METRIC_CONFIGS.reduce(
    (acc, mc) => {
      const trend = sa.summary[mc.key]?.trend || "";
      const colors = getTrendColor(trend);
      if (colors.dot === "bg-rose-500") acc.red++;
      else if (colors.dot === "bg-emerald-500") acc.green++;
      else acc.yellow++;
      return acc;
    },
    { red: 0, yellow: 0, green: 0 }
  );

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* SA Header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors duration-200 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-blue/10 flex items-center justify-center shrink-0">
            <span className="text-accent-blue font-bold text-sm">
              {sa.serviceArea.substring(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {sa.serviceArea}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-foreground-muted">
                {sa.stos.length} STOs
              </span>
              <span className="text-[10px] text-foreground-muted">•</span>
              {trendCounts.green > 0 && (
                <span className="text-[10px] text-emerald-500 font-medium">
                  {trendCounts.green} 🟢
                </span>
              )}
              {trendCounts.yellow > 0 && (
                <span className="text-[10px] text-amber-500 font-medium">
                  {trendCounts.yellow} 🟡
                </span>
              )}
              {trendCounts.red > 0 && (
                <span className="text-[10px] text-rose-500 font-medium">
                  {trendCounts.red} 🔴
                </span>
              )}
            </div>
          </div>
        </div>

        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "shrink-0 text-foreground-muted transition-transform duration-300",
            expanded && "rotate-180"
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* SA Summary Metrics Row */}
      <div className="px-5 pb-4">
        <div className="flex flex-wrap gap-2">
          {METRIC_CONFIGS.map((mc) => (
            <MetricPill
              key={mc.key}
              label={mc.shortLabel}
              metric={sa.summary[mc.key]}
            />
          ))}
        </div>
      </div>

      {/* Expanded STO Table */}
      {expanded && (
        <div className="border-t border-[var(--border)] animate-slide-down">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[var(--surface-hover)] text-xs uppercase tracking-wider text-foreground-muted">
                  <th className="px-4 py-3 font-semibold whitespace-nowrap sticky left-0 bg-[var(--surface-hover)] z-10">
                    STO
                  </th>
                  {METRIC_CONFIGS.map((mc) => (
                    <th
                      key={mc.key}
                      className="px-3 py-3 font-semibold whitespace-nowrap text-center"
                    >
                      {mc.shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sa.stos.map((sto) => (
                  <tr
                    key={sto.sto}
                    className="hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-[var(--surface)]/80 backdrop-blur-sm z-10">
                      <span className="text-sm font-bold text-foreground">
                        {sto.sto}
                      </span>
                    </td>
                    {METRIC_CONFIGS.map((mc) => (
                      <MetricCell
                        key={mc.key}
                        metric={sto[mc.key as keyof typeof sto] as MetricData}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface ReportIHEasternProps {
  data: DistrictData[];
}

export function ReportIHEastern({ data }: ReportIHEasternProps) {
  const [activeDistrict, setActiveDistrict] = useState(0);

  const district = data[activeDistrict];
  if (!district) return null;

  // Compute district-wide trend overview
  const districtTotalSAs = district.serviceAreas.length;
  const districtTotalSTOs = district.serviceAreas.reduce(
    (sum, sa) => sum + sa.stos.length,
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Report IH Eastern
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Fulfillment & Assurance performance by district, service area, and
            STO.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-foreground-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Better
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Same
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Worse
          </div>
        </div>
      </div>

      {/* District Tabs */}
      <div className="glass-card p-1.5 flex gap-1.5 overflow-x-auto">
        {data.map((d, idx) => (
          <button
            key={d.district}
            onClick={() => setActiveDistrict(idx)}
            className={cn(
              "flex-1 min-w-fit px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap",
              activeDistrict === idx
                ? "bg-accent-blue text-white shadow-lg shadow-blue-500/20"
                : "text-foreground-muted hover:bg-[var(--surface-hover)] hover:text-foreground"
            )}
          >
            {d.district}
          </button>
        ))}
      </div>

      {/* District Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {districtTotalSAs}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Service Areas
          </div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {districtTotalSTOs}
          </div>
          <div className="text-xs text-foreground-muted mt-1">STOs</div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {district.serviceAreas
              .reduce(
                (sum, sa) =>
                  sum + (sa.summary.serviceAvailability?.tiketGgn || 0),
                0
              )
              .toLocaleString()}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Total Tiket Ggn
          </div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {district.serviceAreas
              .reduce(
                (sum, sa) =>
                  sum + (sa.summary.serviceAvailability?.lisPlngn || 0),
                0
              )
              .toLocaleString()}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Total Pelanggan
          </div>
        </div>
      </div>

      {/* Service Area Cards */}
      <div className="space-y-4">
        {district.serviceAreas.map((sa) => (
          <ServiceAreaCard key={sa.serviceArea} sa={sa} />
        ))}
      </div>
    </div>
  );
}
