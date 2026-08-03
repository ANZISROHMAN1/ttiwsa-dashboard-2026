"use client";

import { useState, useMemo, Fragment, useRef } from "react";
import { cn } from "@/lib/utils";
import type {
  DistrictData,
  ServiceAreaData,
  MetricSet,
  MetricData,
  MetricKey,
  IHTrendResponse,
} from "@/types/report-ih-eastern";
import { METRIC_CONFIGS, getTrendColor, WSA_TARGETS, TREND_DISTRICT_MAP } from "@/types/report-ih-eastern";

import { Trophy, Medal, Crown, Target, ThumbsUp, Download, TrendingUp } from "lucide-react";
import { toPng } from "html-to-image";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { useTheme } from "@/components/ThemeProvider";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Icon that represents a trend */
function TrendIcon({ trend }: { trend: string }) {
  const c = getTrendColor(trend);
  
  let icon = "";
  if (trend === "🟢") icon = "↑";
  else if (trend === "🟡") icon = "=";
  else if (trend === "🔴") icon = "↓";

  return (
    <span
      className={cn("inline-block shrink-0 text-base font-black leading-none drop-shadow-sm", c.text)}
      title={
        trend === "🟢"
          ? "Better dari kemarin"
          : trend === "🔴"
          ? "Turun dari kemarin"
          : "Nilai dekat/Sama dari kemarin"
      }
    >
      {icon}
    </span>
  );
}

/** A single metric pill used in the SA summary row */
function MetricPill({
  label,
  metric,
  metricKey,
}: {
  label: string;
  metric: MetricData;
  metricKey: keyof MetricSet;
}) {
  const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(',', '.'));
  const target = WSA_TARGETS[metricKey] || 0;
  const isAchieved = !isNaN(realVal) && realVal >= target;

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
        isAchieved ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30",
        "hover:scale-[1.03]"
      )}
    >
      <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider leading-none text-center">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <TrendIcon trend={metric.trend} />
        <span className={cn("text-sm font-bold tabular-nums", isAchieved ? "text-emerald-500" : "text-rose-500")}>
          {realDisplay}
        </span>
      </div>
    </div>
  );
}

/** Metric cell inside the STO table */
function MetricCell({ metric, metricKey }: { metric: MetricData; metricKey: keyof MetricSet }) {
  const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(',', '.'));
  const target = WSA_TARGETS[metricKey] || 0;
  const isAchieved = !isNaN(realVal) && realVal >= target;

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
          <TrendIcon trend={metric.trend} />
          <span className={cn("text-sm font-semibold tabular-nums", isAchieved ? "text-emerald-500" : "text-rose-500")}>
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

  // Count how many metrics achieved their target for the SA summary
  const targetCounts = METRIC_CONFIGS.reduce(
    (acc, mc) => {
      const metric = sa.summary[mc.key];
      if (!metric) return acc;
      const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(',', '.'));
      const target = WSA_TARGETS[mc.key] || 0;
      if (!isNaN(realVal)) {
        if (realVal >= target) acc.achieved++;
        else acc.notAchieved++;
      }
      return acc;
    },
    { achieved: 0, notAchieved: 0 }
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
              {targetCounts.achieved > 0 && (
                <span className="text-[10px] text-emerald-500 font-medium">
                  {targetCounts.achieved} Achieved
                </span>
              )}
              {targetCounts.notAchieved > 0 && (
                <span className="text-[10px] text-rose-500 font-medium">
                  {targetCounts.notAchieved} Missed
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
              metricKey={mc.key}
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
                        metricKey={mc.key}
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

// ─── Monthly Trend Sub-component ────────────────────────────────────────────

interface MonthlyTrendSectionProps {
  districtName: string;
  trendData: IHTrendResponse | null;
  districtServiceAreas: ServiceAreaData[];
}

const TREND_COLORS = [
  "rgba(16, 185, 129, 1)",   // emerald
  "rgba(59, 130, 246, 1)",   // blue
  "rgba(245, 158, 11, 1)",   // amber
  "rgba(239, 68, 68, 1)",    // red
  "rgba(168, 85, 247, 1)",   // purple
  "rgba(249, 115, 22, 1)",   // orange
  "rgba(20, 184, 166, 1)",   // teal
  "rgba(236, 72, 153, 1)",   // pink
  "rgba(99, 102, 241, 1)",   // indigo
  "rgba(34, 197, 94, 1)",    // green
];

function MonthlyTrendSection({ districtName, trendData, districtServiceAreas }: MonthlyTrendSectionProps) {
  const { theme } = useTheme();
  const [selectedSA, setSelectedSA] = useState<string>("ALL");
  const [selectedParam, setSelectedParam] = useState<string>("sa");
  const [showChart, setShowChart] = useState(true);

  // Find the matching trend district key
  const trendKey = useMemo(() => {
    if (!trendData) return null;
    const entry = Object.entries(TREND_DISTRICT_MAP).find(([, v]) => v === districtName);
    return entry ? entry[0] : null;
  }, [trendData, districtName]);

  const trendDistrictData = trendData && trendKey ? trendData[trendKey] : null;
  if (!trendDistrictData) return null;

  const paramData = trendDistrictData[selectedParam] || null;
  const activeConfig = METRIC_CONFIGS.find((mc) => mc.trendKey === selectedParam) || METRIC_CONFIGS[0];
  const targetValue = WSA_TARGETS[activeConfig.key] || 95;

  // Get months and filter out empty future months
  const allMonths = paramData ? Object.keys(paramData) : [];
  const months = allMonths.filter((m) => {
    const vals = Object.values(paramData?.[m] || {});
    return vals.some((v) => v !== "" && v !== null && v !== undefined);
  });

  // Build STO -> SA mapping from the report data
  const stoToSA: Record<string, string> = {};
  districtServiceAreas.forEach((sa) => {
    sa.stos.forEach((sto) => {
      stoToSA[sto.sto] = sa.serviceArea;
    });
  });

  // Get STOs to display (all or filtered by SA)
  const allSTOs = paramData && months.length > 0 ? Object.keys(paramData[months[0]] || {}) : [];
  const filteredSTOs = selectedSA === "ALL"
    ? allSTOs
    : allSTOs.filter((sto) => stoToSA[sto] === selectedSA);

  // SA options for filter
  const saOptions = [...new Set(Object.values(stoToSA))].sort();

  // Calculate suggested y-axis range based on active metric values and target
  const allNumericValues: number[] = [];
  months.forEach((m) => {
    filteredSTOs.forEach((sto) => {
      const val = paramData?.[m]?.[sto];
      if (typeof val === "number" && !isNaN(val)) {
        allNumericValues.push(val);
      }
    });
  });

  const minVal = allNumericValues.length > 0 ? Math.min(...allNumericValues, targetValue) : 90;
  const maxVal = allNumericValues.length > 0 ? Math.max(...allNumericValues, targetValue) : 101;
  const yMin = Math.floor(Math.max(0, minVal - Math.max(2, (maxVal - minVal) * 0.1)));
  const yMax = Math.ceil(Math.min(105, maxVal + Math.max(1, (maxVal - minVal) * 0.05)));

  // Chart data for line chart
  const chartData = {
    labels: months,
    datasets: filteredSTOs.map((sto, idx) => {
      const color = TREND_COLORS[idx % TREND_COLORS.length];
      return {
        label: sto,
        data: months.map((m) => {
          const val = paramData?.[m]?.[sto];
          return typeof val === "number" ? val : null;
        }),
        borderColor: color,
        backgroundColor: color.replace(", 1)", ", 0.1)"),
        borderWidth: 1.5,
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: 0.3,
        spanGaps: true,
      };
    }),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: filteredSTOs.length <= 15,
        position: "top" as const,
        labels: {
          color: theme === "dark" ? "rgba(255,255,255,0.7)" : "#475569",
          font: { size: 10 },
          boxWidth: 8,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => ` ${context.dataset.label}: ${context.raw != null ? context.raw + '%' : 'N/A'}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme === "dark" ? "rgba(255,255,255,0.5)" : "#94a3b8",
          font: { size: 10 },
        },
        grid: {
          color: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
      },
      y: {
        min: yMin,
        max: yMax,
        ticks: {
          color: theme === "dark" ? "rgba(255,255,255,0.5)" : "#94a3b8",
          font: { size: 10 },
          callback: (v: any) => v + '%',
        },
        grid: {
          color: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
      },
    },
  };

  const getHeatColor = (val: number | string) => {
    if (typeof val !== "number" || isNaN(val)) return "";
    if (val >= targetValue) return "bg-emerald-500/20 text-emerald-500 font-bold";
    if (val >= targetValue - 2) return "bg-amber-500/15 text-amber-500 font-semibold";
    return "bg-rose-500/15 text-rose-500 font-semibold";
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full bg-purple-500" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Monthly Trend 2026 — {activeConfig.label}
          </h2>
          <span className="text-[10px] text-foreground-muted font-medium">
            ({districtName})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedSA}
            onChange={(e) => setSelectedSA(e.target.value)}
            className="text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="ALL">All STOs ({allSTOs.length})</option>
            {saOptions.map((sa) => (
              <option key={sa} value={sa}>
                {sa} ({allSTOs.filter((s) => stoToSA[s] === sa).length})
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowChart((prev) => !prev)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium",
              showChart
                ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                : "bg-[var(--surface)] border-[var(--border)] text-foreground-muted hover:text-foreground"
            )}
          >
            {showChart ? "Chart" : "Table"}
          </button>
        </div>
      </div>

      {/* Parameter Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar border-b border-[var(--border)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted mr-1 shrink-0">
          Parameter:
        </span>
        {METRIC_CONFIGS.map((mc) => {
          if (!mc.trendKey) return null;
          const isSelected = selectedParam === mc.trendKey;
          const target = WSA_TARGETS[mc.key];
          return (
            <button
              key={mc.key}
              onClick={() => setSelectedParam(mc.trendKey || "sa")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 border",
                isSelected
                  ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/25 scale-[1.02]"
                  : "bg-[var(--surface)] border-[var(--border)] text-foreground-muted hover:text-foreground hover:bg-[var(--surface-hover)] hover:border-purple-500/30"
              )}
            >
              <span>{mc.shortLabel}</span>
              {target !== undefined && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold leading-none",
                  isSelected ? "bg-white/20 text-white" : "bg-[var(--surface-hover)] text-foreground-muted"
                )}>
                  T: {target}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {months.length === 0 ? (
        <div className="py-12 text-center text-foreground-muted text-xs">
          No monthly trend data recorded yet for {activeConfig.label}.
        </div>
      ) : showChart ? (
        <div className="h-[320px] w-full pt-2">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--surface-hover)] text-foreground-muted">
                <th className="px-3 py-2.5 text-left font-semibold sticky left-0 z-10 bg-[var(--surface-hover)] min-w-[60px]">STO</th>
                <th className="px-3 py-2.5 text-left font-semibold sticky left-[60px] z-10 bg-[var(--surface-hover)] min-w-[100px] shadow-[1px_0_0_0_var(--border)]">SA</th>
                {months.map((m) => (
                  <th key={m} className="px-2 py-2.5 text-center font-semibold whitespace-nowrap min-w-[65px]">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredSTOs.map((sto) => (
                <tr key={sto} className="hover:bg-[var(--surface-hover)]/50 transition-colors">
                  <td className="px-3 py-2 font-bold text-foreground sticky left-0 z-10 bg-[var(--surface)] min-w-[60px]">{sto}</td>
                  <td className="px-3 py-2 text-foreground-muted sticky left-[60px] z-10 bg-[var(--surface)] min-w-[100px] shadow-[1px_0_0_0_var(--border)] truncate" title={stoToSA[sto]}>{stoToSA[sto] || '—'}</td>
                  {months.map((m) => {
                    const val = paramData?.[m]?.[sto];
                    const numVal = typeof val === "number" ? val : parseFloat(String(val || "").replace(',', '.'));
                    const display = !isNaN(numVal) ? `${numVal.toFixed(2)}%` : (val != null && val !== "" ? `${val}%` : "—");
                    return (
                      <td
                        key={m}
                        className={cn(
                          "px-2 py-2 text-center tabular-nums transition-colors",
                          !isNaN(numVal) ? getHeatColor(numVal) : "text-foreground-muted"
                        )}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface ReportIHEasternProps {
  data: DistrictData[];
  trendData?: IHTrendResponse | null;
}

export function ReportIHEastern({ data, trendData }: ReportIHEasternProps) {
  const { theme } = useTheme();
  const [activeDistrict, setActiveDistrict] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleDownloadPNG = async () => {
    if (!tableRef.current) return;
    try {
      const scrollContainer = tableRef.current.querySelector('.overflow-x-auto') as HTMLElement;
      const tableEl = tableRef.current.querySelector('table') as HTMLElement;
      
      let originalOverflow = '';
      let originalWidth = '';
      
      if (scrollContainer && tableEl) {
        originalOverflow = scrollContainer.style.overflow;
        originalWidth = tableRef.current.style.width;
        
        // Force full width and visible overflow
        scrollContainer.style.overflow = 'visible';
        tableRef.current.style.width = `${tableEl.offsetWidth + 40}px`;
      }

      // Small delay to ensure browser paints the new dimensions before capture
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(tableRef.current, {
        cacheBust: true,
        style: {
          backgroundColor: "#ffffff",
        },
      });

      // Restore
      if (scrollContainer) {
        scrollContainer.style.overflow = originalOverflow;
        tableRef.current.style.width = originalWidth;
      }

      const link = document.createElement("a");
      link.download = `WSA-Raw-Data-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download image", err);
      const scrollContainer = tableRef.current?.querySelector('.overflow-x-auto') as HTMLElement;
      if (scrollContainer) {
        scrollContainer.style.overflow = '';
        tableRef.current!.style.width = '';
      }
    }
  };

  const district = data[activeDistrict];
  if (!district) return null;

  const WSA_TARGETS: Record<keyof MetricSet, number> = {
    serviceAvailability: 98.52,
    assuranceGuarantee: 91.71,
    ttrCompDiamond3Jam: 95.25,
    ttrCompPlatinum6Jam: 95.00,
    ttrCompManja3Jam: 94.79,
    ttr36Jam: 85.00,
    tti3x24Jam: 93.31,
    ffg: 98.29,
    ttrFfg: 80.81,
  };

  // ─── Score Calculations ───────────────────────────────────────────────────
  function getSaScore(sa: ServiceAreaData) {
    let achieved = 0;
    let thumbsUp = 0;
    const metrics: { label: string; value: number }[] = [];

    METRIC_CONFIGS.forEach((mc) => {
      const metric = sa.summary[mc.key];
      if (!metric) return;
      const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(',', '.'));
      const target = WSA_TARGETS[mc.key] || 0;

      if (!isNaN(realVal)) {
        if (realVal >= target) {
          achieved++;
          // Only include in pie chart if it achieved the target (contributed to the score)
          const formattedVal = realVal % 1 === 0 ? realVal : Number(realVal.toFixed(2));
          metrics.push({ label: mc.shortLabel, value: formattedVal });
        }
      }
      if (metric.trend === "🟢") thumbsUp++;
    });
    return { sa, achieved, thumbsUp, metrics };
  }

  // 1. Overall Best SA
  const allSAsWithScores = data.flatMap((d) =>
    d.serviceAreas.map((sa) => ({ district: d.district, ...getSaScore(sa) }))
  );
  allSAsWithScores.sort((a, b) => {
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    return b.thumbsUp - a.thumbsUp;
  });
  const overallBestSA = allSAsWithScores[0];

  // 2. Best SA in Active District
  const activeDistrictSAs = district.serviceAreas.map((sa) => ({
    district: district.district,
    ...getSaScore(sa),
  }));
  activeDistrictSAs.sort((a, b) => {
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    return b.thumbsUp - a.thumbsUp;
  });
  const districtBestSA = activeDistrictSAs[0];

  // 3. Top 3 Districts Overall
  const districtScores = data.map((d) => {
    let totalMetrics = 0;
    let totalAchieved = 0;
    d.serviceAreas.forEach((sa) => {
      const score = getSaScore(sa);
      totalAchieved += score.achieved;
      totalMetrics += 9;
    });
    const percentage =
      totalMetrics > 0 ? (totalAchieved / totalMetrics) * 100 : 0;
    return { district: d.district, percentage };
  });
  districtScores.sort((a, b) => b.percentage - a.percentage);
  const top3Districts = districtScores.slice(0, 3);

  const pieData = {
    labels: overallBestSA?.metrics.map((m) => m.label) || [],
    datasets: [
      {
        data: overallBestSA?.metrics.map((m) => m.value) || [],
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)", // emerald
          "rgba(59, 130, 246, 0.85)", // blue
          "rgba(245, 158, 11, 0.85)", // amber
          "rgba(239, 68, 68, 0.85)",  // red
          "rgba(168, 85, 247, 0.85)", // purple
          "rgba(249, 115, 22, 0.85)", // orange
          "rgba(20, 184, 166, 0.85)", // teal
          "rgba(236, 72, 153, 0.85)", // pink
          "rgba(99, 102, 241, 0.85)", // indigo
        ],
        borderColor: "rgba(15, 23, 42, 0.8)",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.8)" : "#475569",
          font: { size: 10 },
          boxWidth: 8,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  // Compute district-wide trend overview
  const districtTotalSAs = district.serviceAreas.length;
  const districtTotalSTOs = district.serviceAreas.reduce(
    (sum, sa) => sum + sa.stos.length,
    0
  );

  const averages = METRIC_CONFIGS.map(mc => {
    const sum = district.serviceAreas.reduce((acc, sa) => {
      const real = sa.summary[mc.key]?.real || 0;
      return acc + (typeof real === 'number' ? real : parseFloat(String(real).replace(',', '.')) || 0);
    }, 0);
    const avg = district.serviceAreas.length > 0 ? sum / district.serviceAreas.length : 0;
    const target = WSA_TARGETS[mc.key] || 0;
    const diff = avg - target;
    return { label: mc.shortLabel, avg, target, diff };
  });

  const top3Achieving = [...averages].sort((a, b) => b.diff - a.diff).slice(0, 3);
  const top3Unachieving = [...averages].sort((a, b) => a.diff - b.diff).slice(0, 3);

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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 text-xs text-foreground-muted justify-end">
            <span className="font-semibold text-[10px] uppercase tracking-wider">Trend:</span>
            <div className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">👍</span> Better</div>
            <div className="flex items-center gap-1.5"><span className="text-amber-500 font-bold">=</span> Same</div>
            <div className="flex items-center gap-1.5"><span className="text-rose-500 font-bold">👎</span> Worse</div>
          </div>
          <div className="flex items-center gap-4 text-xs text-foreground-muted justify-end">
            <span className="font-semibold text-[10px] uppercase tracking-wider">KPI:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Achieved Target
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Needs Attention
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Widget 1: Global Best SA */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="mb-4 relative z-10">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Crown className="w-4 h-4 text-emerald-400" />
              Global Best SA
            </h3>
            <p className="text-[10px] text-foreground-muted mt-1">Highest parameters achieved across all districts</p>
          </div>

          {overallBestSA && (
            <div className="relative z-10 flex flex-col flex-1 h-[calc(100%-60px)]">
              <div className="flex items-center justify-between bg-[var(--surface-hover)] p-3 rounded-xl border border-[var(--border)] mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <span className="text-emerald-400 font-bold text-sm tracking-widest">{overallBestSA.sa.serviceArea.substring(0, 2)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{overallBestSA.sa.serviceArea}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">{overallBestSA.district}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1">
                    {overallBestSA.achieved} <Target className="w-3 h-3" />
                  </div>
                  <div className="text-[10px] text-emerald-500/70">{overallBestSA.thumbsUp} Positive</div>
                </div>
              </div>
              <div className="h-[140px] w-full relative">
                <Doughnut data={pieData} options={pieOptions} />
              </div>
            </div>
          )}
        </div>

        {/* Widget 2: Top 3 Districts */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mb-10 pointer-events-none"></div>
          
          <div className="mb-4 relative z-10">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Top 3 Districts
            </h3>
            <p className="text-[10px] text-foreground-muted mt-1">Based on total % of targets achieved</p>
          </div>

          <div className="relative z-10 flex-1 flex items-end justify-center gap-1.5 pt-6 pb-2">
            {/* 2nd Place (Left) */}
            {top3Districts[1] && (
              <div className="flex flex-col items-center w-1/3">
                <div className="text-center mb-5 w-full">
                  <div className="text-xs font-bold text-foreground truncate w-full px-1" title={top3Districts[1].district}>
                    {top3Districts[1].district}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">{top3Districts[1].percentage.toFixed(1)}%</div>
                </div>
                <div className="w-full bg-slate-400 border-t border-slate-300 rounded-t-md h-16 flex items-start justify-center pt-2 relative">
                  <span className="text-slate-900 font-black text-lg">2</span>
                  <div className="absolute -top-4 bg-[var(--surface)] rounded-full p-1 border border-[var(--border)] shadow-md">
                    <Medal className="w-3 h-3 text-slate-500" />
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place (Center) */}
            {top3Districts[0] && (
              <div className="flex flex-col items-center w-1/3 z-10">
                <div className="text-center mb-6 w-full">
                  <div className="text-sm font-black text-amber-500 truncate w-full px-1" title={top3Districts[0].district}>
                    {top3Districts[0].district}
                  </div>
                  <div className="inline-block text-[10px] text-amber-600 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded mt-0.5 border border-amber-500/20">
                    {top3Districts[0].percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="w-full bg-amber-500 border-t-2 border-amber-400 rounded-t-md h-24 flex items-start justify-center pt-2 relative shadow-[0_-5px_15px_rgba(251,191,36,0.25)]">
                  <span className="text-amber-950 font-black text-2xl">1</span>
                  <div className="absolute -top-5 bg-[var(--surface)] rounded-full p-1.5 border border-amber-500/30 shadow-lg shadow-amber-500/20">
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place (Right) */}
            {top3Districts[2] && (
              <div className="flex flex-col items-center w-1/3">
                <div className="text-center mb-5 w-full">
                  <div className="text-xs font-bold text-foreground truncate w-full px-1" title={top3Districts[2].district}>
                    {top3Districts[2].district}
                  </div>
                  <div className="text-[10px] text-amber-700 font-bold mt-0.5">{top3Districts[2].percentage.toFixed(1)}%</div>
                </div>
                <div className="w-full bg-amber-700 border-t border-amber-600 rounded-t-md h-12 flex items-start justify-center pt-2 relative">
                  <span className="text-amber-50 font-black text-base">3</span>
                  <div className="absolute -top-4 bg-[var(--surface)] rounded-full p-1 border border-[var(--border)] shadow-md">
                    <Medal className="w-3 h-3 text-amber-700" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Widget 3: Best SA per District */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="mb-4 relative z-10">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              Best in {district.district}
            </h3>
            <p className="text-[10px] text-foreground-muted mt-1">Top performing SA in current district</p>
          </div>

          {districtBestSA && (
            <div className="relative z-10 flex flex-col flex-1 justify-center">
              <div className="bg-[var(--surface-hover)] p-5 rounded-xl border border-[var(--border)] relative overflow-hidden">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <span className="text-blue-400 font-bold text-lg tracking-widest">{districtBestSA.sa.serviceArea.substring(0, 2)}</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{districtBestSA.sa.serviceArea}</div>
                    <div className="text-xs text-blue-400 mt-0.5">Exceptional Performance</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)] text-center flex flex-col justify-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <Target className="w-3 h-3 text-blue-400" /> Targets
                    </div>
                    <div className="text-lg font-bold text-blue-400">{districtBestSA.achieved} <span className="text-[10px] text-foreground-muted">/ {METRIC_CONFIGS.length}</span></div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)] text-center flex flex-col justify-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <ThumbsUp className="w-3 h-3 text-blue-400" /> Trends
                    </div>
                    <div className="text-lg font-bold text-blue-400">{districtBestSA.thumbsUp} <span className="text-[10px] text-foreground-muted">pos</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* ─── District Performance (from API districtSummary) ────────── */}
      {district.districtSummary && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-1 h-5 rounded-full bg-accent-blue" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              District Performance
            </h2>
            <span className="text-[10px] text-foreground-muted font-medium ml-1">
              — {district.district}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
            {METRIC_CONFIGS.map((mc) => {
              const metric = district.districtSummary[mc.key];
              if (!metric) return null;

              const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(',', '.'));
              const h1Val = typeof metric.h1 === "number" ? metric.h1 : parseFloat(String(metric.h1).replace(',', '.'));
              const target = WSA_TARGETS[mc.key] || 0;
              const isAchieved = !isNaN(realVal) && realVal >= target;

              // Use the API trend emoji directly
              const trendColors = getTrendColor(metric.trend);
              let trendArrow = "=";
              if (metric.trend === "🟢") trendArrow = "↑";
              else if (metric.trend === "🔴") trendArrow = "↓";

              return (
                <div
                  key={mc.key}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-3.5 transition-all duration-200 hover:scale-[1.02] group",
                    isAchieved
                      ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                      : "border-rose-500/25 bg-rose-500/[0.04]"
                  )}
                >
                  {/* Subtle glow */}
                  <div
                    className={cn(
                      "absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-30 pointer-events-none transition-opacity group-hover:opacity-50",
                      isAchieved ? "bg-emerald-500" : "bg-rose-500"
                    )}
                  />

                  {/* Label */}
                  <div className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted mb-2 leading-none relative z-10">
                    {mc.shortLabel}
                  </div>

                  {/* Hero number */}
                  <div className="relative z-10 flex items-baseline gap-1">
                    <span className="text-[10px] font-medium text-foreground-muted leading-none">=</span>
                    <span
                      className={cn(
                        "text-lg font-extrabold tabular-nums leading-none tracking-tight",
                        isAchieved ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {!isNaN(realVal) ? `${realVal.toFixed(2)}%` : metric.real != null ? `${metric.real}%` : "-"}
                    </span>
                  </div>

                  {/* Trend & H-1 */}
                  <div className="mt-2 flex items-center gap-1.5 relative z-10">
                    <span className={cn("text-xs font-black leading-none", trendColors.text)}>
                      {trendArrow}
                    </span>
                    <span className="text-[10px] text-foreground-muted tabular-nums">
                      H-1: {!isNaN(h1Val) ? `${h1Val.toFixed(2)}%` : metric.h1 != null ? `${metric.h1}%` : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* District Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-sm p-4 text-center flex flex-col justify-center">
          <div className="text-3xl font-bold text-foreground">
            {districtTotalSAs}
          </div>
          <div className="text-xs text-foreground-muted mt-1 uppercase tracking-wider font-semibold">
            Service Areas
          </div>
        </div>
        <div className="glass-card-sm p-4 text-center flex flex-col justify-center">
          <div className="text-3xl font-bold text-foreground">
            {districtTotalSTOs}
          </div>
          <div className="text-xs text-foreground-muted mt-1 uppercase tracking-wider font-semibold">STOs</div>
        </div>
        
        <div className="glass-card-sm p-4 flex flex-col justify-between">
          <div className="text-xs text-foreground-muted uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Top Achieving
          </div>
          <div className="space-y-2">
            {top3Achieving.map((item, i) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-500 tabular-nums">
                    {item.avg.toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-emerald-500/70 tabular-nums bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                    +{item.diff.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-sm p-4 flex flex-col justify-between">
          <div className="text-xs text-foreground-muted uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Needs Attention
          </div>
          <div className="space-y-2">
            {top3Unachieving.map((item, i) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-500 tabular-nums">
                    {item.avg.toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-rose-500/70 tabular-nums bg-rose-500/10 px-1.5 py-0.5 rounded-sm">
                    {item.diff.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Area Cards */}
      <div className="space-y-4">
        {district.serviceAreas.map((sa) => (
          <ServiceAreaCard key={sa.serviceArea} sa={sa} />
        ))}
      </div>

      {/* Monthly Trend */}
      <MonthlyTrendSection
        districtName={district.district}
        trendData={trendData || null}
        districtServiceAreas={district.serviceAreas}
      />

      {/* Raw Data Table */}
      <div className="glass-card p-5 mt-10" ref={tableRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Raw Data Table</h3>
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors border border-blue-500/20"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 z-30 bg-[var(--surface-hover)] shadow-sm shadow-black/5 ring-1 ring-[var(--border)]/50">
              <tr>
                <th className="px-4 py-3 font-semibold sticky left-0 z-40 bg-[var(--surface-hover)] min-w-[150px] max-w-[150px]">Service Area</th>
                <th className="px-4 py-3 font-semibold sticky left-[150px] z-40 bg-[var(--surface-hover)] min-w-[80px] max-w-[80px] shadow-[1px_0_0_0_var(--border)]">STO</th>
                {METRIC_CONFIGS.map((mc, idx) => (
                  <th key={mc.key} className={cn("px-4 py-3 font-semibold text-center", idx !== 0 && "border-l-2 border-[var(--border)]")} colSpan={4}>
                    <div>{mc.shortLabel}</div>
                    <div className="text-[10px] font-normal text-foreground-muted mt-0.5 whitespace-nowrap">
                      Target: {WSA_TARGETS[mc.key]}%
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-[var(--border)] text-xs text-foreground-muted bg-[var(--surface-hover)]/30 backdrop-blur-sm">
                <th className="px-4 py-2 sticky left-0 z-40 bg-[var(--surface-hover)] min-w-[150px] max-w-[150px]"></th>
                <th className="px-4 py-2 sticky left-[150px] z-40 bg-[var(--surface-hover)] min-w-[80px] max-w-[80px] shadow-[1px_0_0_0_var(--border)]"></th>
                {METRIC_CONFIGS.map((mc, idx) => (
                  <Fragment key={mc.key}>
                    <th className={cn("px-4 py-2 text-center", idx !== 0 && "border-l-2 border-[var(--border)]")}>Real</th>
                    <th className="px-4 py-2 text-center border-l border-[var(--border)]/30">H-1</th>
                    <th className="px-4 py-2 text-center border-l border-[var(--border)]/30">Ach</th>
                    <th className="px-4 py-2 text-center border-l border-[var(--border)]/30">Trend</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {district.serviceAreas.flatMap(sa => 
                sa.stos.map(sto => (
                  <tr key={sto.sto} className="group hover:bg-[var(--surface-hover)]/50 transition-colors">
                    <td className="px-4 py-2 sticky left-0 z-10 bg-[var(--surface)] group-hover:bg-[var(--surface-hover)] transition-colors min-w-[150px] max-w-[150px] truncate" title={sa.serviceArea}>{sa.serviceArea}</td>
                    <td className="px-4 py-2 font-medium sticky left-[150px] z-10 bg-[var(--surface)] group-hover:bg-[var(--surface-hover)] transition-colors min-w-[80px] max-w-[80px] shadow-[1px_0_0_0_var(--border)]">{sto.sto}</td>
                    {METRIC_CONFIGS.map((mc, idx) => {
                      const m = (sto as any)[mc.key];
                      return (
                        <Fragment key={mc.key}>
                          <td className={cn("px-4 py-2 text-center", idx !== 0 && "border-l-2 border-[var(--border)]")}>
                            {m?.real != null ? (typeof m.real === 'number' ? m.real.toFixed(2) + '%' : String(m.real).endsWith('%') ? m.real : m.real + '%') : '-'}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-[var(--border)]/30">
                            {typeof m?.h1 === 'number' ? m.h1.toFixed(2) + '%' : (m?.h1 ?? '-')}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-[var(--border)]/30">
                            {typeof m?.ach === 'number' ? (m.ach * 100).toFixed(2) + '%' : (m?.ach ?? '-')}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-[var(--border)]/30">{m?.trend ?? '-'}</td>
                        </Fragment>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
