"use client";

import { useState, useMemo, Fragment, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type {
  DistrictData,
  ServiceAreaData,
  MetricSet,
  MetricData,
  MetricKey,
  IHTrendResponse,
  STOData,
} from "@/types/report-ih-eastern";
import { getTrendColor, TREND_DISTRICT_MAP } from "@/types/report-ih-eastern";

export interface EbisMetricConfig {
  key: string;
  label: string;
  shortLabel: string;
  target: number;
  isLowerBetter?: boolean;
  count1?: { key: string; label: string };
  count2?: { key: string; label: string };
  trendKey?: string;
}

const FF_METRIC_CONFIGS: EbisMetricConfig[] = [
  { key: "fulfillmentGuarantee", label: "Fulfillment Guarantee", shortLabel: "FFG", target: 93.00, count1: { key: "comply", label: "Comply" }, count2: { key: "notCmply", label: "Not Comply" }, trendKey: "ffg" },
  { key: "tti1X24Jam", label: "TTI 1x24 Jam", shortLabel: "TTI 1x24", target: 93.00, count1: { key: "comply", label: "Comply" }, count2: { key: "notCmply", label: "Not Comply" }, trendKey: "tti1x24Jam" },
  { key: "ttrFulfillmentGuarantee3Jam", label: "TTR FFG 3 Jam", shortLabel: "TTR FFG", target: 87.00, count1: { key: "jmlTerukur", label: "Jml Terukur" }, count2: { key: "undrspc", label: "Underspec" }, trendKey: "ttrFfg" },
  { key: "underspecGuarantee", label: "Underspec Guarantee", shortLabel: "Underspec", target: 99.30, count1: { key: "jmlPs", label: "Jml PS" }, count2: { key: "jmlPi", label: "Jml PI" }, trendKey: "underspecGuarantee" },
  { key: "psToPiRatio", label: "PS to PI Ratio", shortLabel: "PS/PI Ratio", target: 93.00, trendKey: "psToPiRatio" },
];

const ASSURANCE_METRIC_CONFIGS: EbisMetricConfig[] = [
  { key: "qGangguan", label: "Q-Gangguan", shortLabel: "Q-Ggn", target: 2.40, isLowerBetter: true, count1: { key: "tiketGgn", label: "Tiket Ggn" }, count2: { key: "gaul", label: "Gaul" }, trendKey: "qHsi" },
  { key: "asgarHsi", label: "ASGAR HSI", shortLabel: "ASGAR HSI", target: 91.00, count1: { key: "gaul", label: "Gaul" }, count2: { key: "tiketGgn", label: "Tiket Ggn" }, trendKey: "asgarHsi" },
  { key: "asgarDatin", label: "ASGAR DATIN", shortLabel: "ASGAR DTN", target: 90.00, count1: { key: "gaul", label: "Gaul" }, count2: { key: "tiketGgn", label: "Tiket Ggn" }, trendKey: "asgarDatin" },
  { key: "asgarWifi", label: "ASGAR WIFI", shortLabel: "ASGAR WIFI", target: 90.50, count1: { key: "gaul", label: "Gaul" }, count2: { key: "terganggu", label: "Terganggu" }, trendKey: "asgarWifi" },
  { key: "ttr24jRegulerIndibiz", label: "TTR 24J Reguler Indibiz", shortLabel: "TTR 24J", target: 91.00, count1: { key: "comply", label: "Comply" }, count2: { key: "notComp", label: "Not Comply" }, trendKey: "ttr24jRegulerIndibiz" },
];

function isMetricAchieved(realVal: number, config?: EbisMetricConfig | null): boolean {
  if (isNaN(realVal) || !config) return false;
  if (config.isLowerBetter) {
    return realVal <= config.target;
  }
  return realVal >= config.target;
}

import { Trophy, Medal, Crown, Target, ThumbsUp, Download, TrendingUp, AlertTriangle } from "lucide-react";
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
  config,
}: {
  label: string;
  metric: MetricData;
  config: EbisMetricConfig;
}) {
  if (!metric) return null;

  const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real ?? "").replace(',', '.'));
  const isAchieved = isMetricAchieved(realVal, config);

  const realDisplay =
    typeof metric.real === "number"
      ? metric.real % 1 === 0
        ? `${metric.real}%`
        : `${metric.real.toFixed(2)}%`
      : metric.real != null && metric.real !== "" ? `${metric.real}%` : "-";

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
        <TrendIcon trend={metric.trend ?? ""} />
        <span className={cn("text-sm font-bold tabular-nums", isAchieved ? "text-emerald-500" : "text-rose-500")}>
          {realDisplay}
        </span>
      </div>
    </div>
  );
}

/** Metric cell inside the STO table */
function MetricCell({ metric, config, unachievingOnly }: { metric: MetricData; config?: EbisMetricConfig | null; unachievingOnly?: boolean }) {
  if (!metric) {
    return (
      <td className="px-3 py-3 whitespace-nowrap text-center text-foreground-muted text-sm">
        -
      </td>
    );
  }

  const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real ?? "").replace(',', '.'));
  const isAchieved = isMetricAchieved(realVal, config);

  if (unachievingOnly && isAchieved) {
    return (
      <td className="px-3 py-3 whitespace-nowrap text-center">
        <span className="text-foreground-muted/20 text-xs font-normal">-</span>
      </td>
    );
  }

  const realDisplay =
    typeof metric.real === "number"
      ? metric.real % 1 === 0
        ? `${metric.real}%`
        : `${metric.real.toFixed(2)}%`
      : metric.real != null && metric.real !== "" ? `${metric.real}%` : "-";

  const anyMetric = metric as any;
  const hasDetail =
    anyMetric.comply !== undefined || anyMetric.notComply !== undefined || anyMetric.notComp !== undefined || anyMetric.notCmply !== undefined || anyMetric.tiketGgn !== undefined || anyMetric.undrspc !== undefined || anyMetric.jmlTerukur !== undefined || anyMetric.jmlPs !== undefined || anyMetric.jmlPi !== undefined;

  return (
    <td className="px-3 py-3 whitespace-nowrap">
      <div className="flex flex-col items-center gap-0.5 group relative">
        <div className="flex items-center gap-1.5">
          <TrendIcon trend={metric.trend ?? ""} />
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              isAchieved ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {realDisplay}
          </span>
        </div>
        {/* Hover tooltip with extra detail */}
        {hasDetail && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 pointer-events-none">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-3 text-xs whitespace-nowrap space-y-1">
              {anyMetric.comply !== undefined && (
                <div>
                  <span className="text-foreground-muted">Comply:</span>{" "}
                  <span className="font-semibold text-foreground">{anyMetric.comply}</span>
                </div>
              )}
              {(anyMetric.notComply !== undefined || anyMetric.notComp !== undefined || anyMetric.notCmply !== undefined) && (
                <div>
                  <span className="text-foreground-muted">Not Comply:</span>{" "}
                  <span className="font-semibold text-rose-400">
                    {anyMetric.notComply ?? anyMetric.notComp ?? anyMetric.notCmply}
                  </span>
                </div>
              )}
              {anyMetric.tiketGgn !== undefined && (
                <div>
                  <span className="text-foreground-muted">Tiket Ggn:</span>{" "}
                  <span className="font-semibold text-foreground">{anyMetric.tiketGgn}</span>
                </div>
              )}
              {anyMetric.gaul !== undefined && (
                <div>
                  <span className="text-foreground-muted">Gaul:</span>{" "}
                  <span className="font-semibold text-rose-400">{anyMetric.gaul}</span>
                </div>
              )}
              {anyMetric.jmlTerukur !== undefined && (
                <div>
                  <span className="text-foreground-muted">Jml Terukur:</span>{" "}
                  <span className="font-semibold text-foreground">{anyMetric.jmlTerukur}</span>
                </div>
              )}
              {anyMetric.undrspc !== undefined && (
                <div>
                  <span className="text-foreground-muted">Underspec:</span>{" "}
                  <span className="font-semibold text-rose-400">{anyMetric.undrspc}</span>
                </div>
              )}
              {anyMetric.jmlPs !== undefined && (
                <div>
                  <span className="text-foreground-muted">Jml PS:</span>{" "}
                  <span className="font-semibold text-foreground">{anyMetric.jmlPs}</span>
                </div>
              )}
              {anyMetric.jmlPi !== undefined && (
                <div>
                  <span className="text-foreground-muted">Jml PI:</span>{" "}
                  <span className="font-semibold text-foreground">{anyMetric.jmlPi}</span>
                </div>
              )}
              {anyMetric.thresholdNc !== undefined && (
                <div>
                  <span className="text-foreground-muted">Threshold NC:</span>{" "}
                  <span className="font-semibold text-foreground">{anyMetric.thresholdNc}</span>
                </div>
              )}
              {anyMetric.dev !== undefined && (
                <div>
                  <span className="text-foreground-muted">Dev:</span>{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      anyMetric.dev > 0
                        ? "text-emerald-400"
                        : anyMetric.dev < 0
                        ? "text-rose-400"
                        : "text-foreground"
                    )}
                  >
                    {anyMetric.dev > 0 ? `+${anyMetric.dev}` : anyMetric.dev}
                  </span>
                </div>
              )}
              {anyMetric.h1 !== undefined && (
                <div className="border-t border-[var(--border)] pt-1 mt-1">
                  <span className="text-foreground-muted">H-1:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {typeof anyMetric.h1 === "number" ? `${anyMetric.h1.toFixed(2)}%` : anyMetric.h1 ?? "-"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </td>
  );
}

/** Expandable Service Area card */
function ServiceAreaCard({ sa, configs, unachievingOnly }: { sa: ServiceAreaData; configs: EbisMetricConfig[]; unachievingOnly?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (unachievingOnly) setExpanded(true);
  }, [unachievingOnly]);

  const pillConfigs = configs.filter((mc) => {
    if (!unachievingOnly) return true;
    const m = (sa.summary as any)[mc.key];
    if (!m) return false;
    const realVal = typeof m.real === "number" ? m.real : parseFloat(String(m.real ?? "").replace(',', '.'));
    return isNaN(realVal) || !isMetricAchieved(realVal, mc);
  });

  const tableColumnConfigs = configs.filter((mc) => {
    if (!unachievingOnly) return true;
    return sa.stos.some(sto => {
      const sm = (sto as any)[mc.key];
      if (!sm) return false;
      const realVal = typeof sm.real === "number" ? sm.real : parseFloat(String(sm.real ?? "").replace(',', '.'));
      return isNaN(realVal) || !isMetricAchieved(realVal, mc);
    });
  });

  // Count how many metrics achieved their target for the SA summary
  const targetCounts = configs.reduce(
    (acc, mc) => {
      const metric = (sa.summary as any)[mc.key];
      if (!metric) return acc;
      const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real ?? "").replace(',', '.'));
      if (!isNaN(realVal)) {
        if (isMetricAchieved(realVal, mc)) acc.achieved++;
        else acc.notAchieved++;
      }
      return acc;
    },
    { achieved: 0, notAchieved: 0 }
  );

  const filteredStos = sa.stos.filter((sto) => {
    if (!unachievingOnly) return true;
    return configs.some((mc) => {
      const m = (sto as any)[mc.key];
      if (!m) return false;
      const realVal = typeof m.real === "number" ? m.real : parseFloat(String(m.real ?? "").replace(',', '.'));
      return isNaN(realVal) || !isMetricAchieved(realVal, mc);
    });
  });

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
              {!unachievingOnly && targetCounts.achieved > 0 && (
                <>
                  <span className="text-[10px] text-foreground-muted">•</span>
                  <span className="text-[10px] text-emerald-500 font-medium">
                    {targetCounts.achieved} Achieved
                  </span>
                </>
              )}
              {targetCounts.notAchieved > 0 && (
                <>
                  <span className="text-[10px] text-foreground-muted">•</span>
                  <span className="text-[10px] text-rose-500 font-bold">
                    {targetCounts.notAchieved} Missed
                  </span>
                </>
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
          {pillConfigs.map((mc) => (
            <MetricPill
              key={mc.key}
              label={mc.shortLabel}
              metric={(sa.summary as any)[mc.key]}
              config={mc}
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
                  {tableColumnConfigs.map((mc) => (
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
                {filteredStos.map((sto) => (
                  <tr
                    key={sto.sto}
                    className="hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-[var(--surface)]/80 backdrop-blur-sm z-10">
                      <span className="text-sm font-bold text-foreground">
                        {sto.sto}
                      </span>
                    </td>
                    {tableColumnConfigs.map((mc) => (
                      <MetricCell
                        key={mc.key}
                        metric={(sto as any)[mc.key] as MetricData}
                        config={mc}
                        unachievingOnly={unachievingOnly}
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

interface MonthlyEbisTrendSectionProps {
  districtName: string;
  trendData: IHTrendResponse | null;
  districtServiceAreas: ServiceAreaData[];
  configs: EbisMetricConfig[];
  mode: "FF" | "ASSURANCE";
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

function MonthlyEbisTrendSection({ districtName, trendData, districtServiceAreas, configs, mode }: MonthlyEbisTrendSectionProps) {
  const { theme } = useTheme();
  const [selectedSA, setSelectedSA] = useState<string>("ALL");
  const [selectedSTO, setSelectedSTO] = useState<string>("ALL");
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [showChart, setShowChart] = useState(true);

  // Automatically find active metric config (or reset when switching FF/Assurance modes)
  const activeConfig = useMemo(() => {
    return configs.find((mc) => mc.trendKey === selectedParam) || configs[0] || null;
  }, [configs, selectedParam]);

  const activeTrendKey = activeConfig?.trendKey || "";

  const trendKey = useMemo(() => {
    if (!trendData) return null;
    const entry = Object.entries(TREND_DISTRICT_MAP).find(([, v]) => v === districtName);
    return entry ? entry[0] : null;
  }, [trendData, districtName]);

  const trendDistrictData = trendData && trendKey ? trendData[trendKey] : null;
  if (!trendDistrictData) return null;

  const paramData = trendDistrictData[activeTrendKey] || null;

  const allMonths = paramData ? Object.keys(paramData) : [];
  const months = allMonths.filter((m) => {
    const vals = Object.values(paramData?.[m] || {});
    return vals.some((v) => v !== "" && v !== null && v !== undefined);
  });

  const stoToSA: Record<string, string> = {};
  districtServiceAreas.forEach((sa) => {
    sa.stos?.forEach((sto) => {
      stoToSA[sto.sto] = sa.serviceArea;
    });
  });

  const allSTOs = paramData && months.length > 0 ? Object.keys(paramData[months[0]] || {}) : [];

  const saOptions = [...new Set(Object.values(stoToSA))].sort();

  const stosInSelectedSA = selectedSA === "ALL"
    ? allSTOs
    : allSTOs.filter((sto) => stoToSA[sto] === selectedSA);

  const filteredSTOs = selectedSTO !== "ALL" 
    ? [selectedSTO].filter(sto => selectedSA === "ALL" || stoToSA[sto] === selectedSA)
    : stosInSelectedSA;

  // Calculate dynamic suggested Y-axis range
  const targetValue = activeConfig?.target || 90;
  const isLowerBetter = activeConfig?.isLowerBetter || false;
  const allNumericValues: number[] = [];
  months.forEach((m) => {
    filteredSTOs.forEach((sto) => {
      const val = paramData?.[m]?.[sto];
      if (typeof val === "number" && !isNaN(val)) {
        allNumericValues.push(val);
      }
    });
  });

  const minVal = allNumericValues.length > 0 ? Math.min(...allNumericValues, targetValue) : (isLowerBetter ? 0 : 85);
  const maxVal = allNumericValues.length > 0 ? Math.max(...allNumericValues, targetValue) : (isLowerBetter ? 10 : 101);
  const spread = Math.max(isLowerBetter ? 1 : 2, maxVal - minVal);
  const yMin = Math.floor(Math.max(0, minVal - spread * 0.15));
  const yMax = Math.ceil(maxVal + spread * 0.1);

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
    if (typeof val !== "number" || isNaN(val) || !activeConfig) return "";
    const isAchieved = isMetricAchieved(val, activeConfig);
    if (isAchieved) return "bg-emerald-500/20 text-emerald-500 font-bold";
    const margin = activeConfig.isLowerBetter ? val - activeConfig.target : activeConfig.target - val;
    if (margin <= (activeConfig.isLowerBetter ? 0.5 : 2)) return "bg-amber-500/15 text-amber-500 font-semibold";
    return "bg-rose-500/15 text-rose-500 font-semibold";
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-1 h-5 rounded-full", mode === "FF" ? "bg-blue-500" : "bg-teal-500")} />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className={cn("w-4 h-4", mode === "FF" ? "text-blue-400" : "text-teal-400")} />
            Monthly {mode === "FF" ? "Fulfillment" : "Assurance"} Trend 2026 — {activeConfig?.label}
          </h2>
          <span className="text-[10px] text-foreground-muted font-medium">
            ({districtName})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedSA}
            onChange={(e) => {
              setSelectedSA(e.target.value);
              setSelectedSTO("ALL");
            }}
            className="text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="ALL">All SA ({saOptions.length})</option>
            {saOptions.map((sa) => (
              <option key={sa} value={sa}>
                {sa} ({allSTOs.filter((s) => stoToSA[s] === sa).length})
              </option>
            ))}
          </select>
          <select
            value={selectedSTO}
            onChange={(e) => setSelectedSTO(e.target.value)}
            className="text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="ALL">All STO ({stosInSelectedSA.length})</option>
            {stosInSelectedSA.map((sto) => (
              <option key={sto} value={sto}>
                {sto}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowChart((prev) => !prev)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium",
              showChart
                ? (mode === "FF" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-teal-500/10 border-teal-500/30 text-teal-400")
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
        {configs.map((mc) => {
          if (!mc.trendKey) return null;
          const isSelected = activeConfig?.key === mc.key;
          return (
            <button
              key={mc.key}
              onClick={() => setSelectedParam(mc.trendKey || "")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 border",
                isSelected
                  ? (mode === "FF"
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25 scale-[1.02]"
                      : "bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-500/25 scale-[1.02]")
                  : "bg-[var(--surface)] border-[var(--border)] text-foreground-muted hover:text-foreground hover:bg-[var(--surface-hover)]"
              )}
            >
              <span>{mc.shortLabel}</span>
              {mc.target !== undefined && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold leading-none",
                  isSelected ? "bg-white/20 text-white" : "bg-[var(--surface-hover)] text-foreground-muted"
                )}>
                  T: {mc.isLowerBetter ? `≤${mc.target}%` : `≥${mc.target}%`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {months.length === 0 ? (
        <div className="py-12 text-center text-foreground-muted text-xs">
          No monthly trend data recorded yet for {activeConfig?.label || "this parameter"}.
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

interface ReportEbisEasternProps {
  data: DistrictData[];
  assuranceData?: DistrictData[] | null;
  trendData?: IHTrendResponse | null;
}

export function ReportEbisEastern({ data, assuranceData, trendData }: ReportEbisEasternProps) {
  const { theme } = useTheme();
  const [activeDistrict, setActiveDistrict] = useState(0);
  const [mode, setMode] = useState<"FF" | "ASSURANCE">("FF");
  const [unachievingOnly, setUnachievingOnly] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const activeData = (mode === "ASSURANCE" ? assuranceData : data) || data;
  const configs = mode === "ASSURANCE" ? ASSURANCE_METRIC_CONFIGS : FF_METRIC_CONFIGS;

  function isMetricUnachieving(metric?: MetricData | null, config?: EbisMetricConfig | null): boolean {
    if (!metric || !config) return false;
    const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real ?? "").replace(',', '.'));
    return isNaN(realVal) || !isMetricAchieved(realVal, config);
  }

  function hasRecordUnachieving(dataRecord: Record<string, any>): boolean {
    return configs.some(c => isMetricUnachieving(dataRecord[c.key], c));
  }

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
      link.download = `EBIS-Raw-Data-${new Date().toISOString().split("T")[0]}.png`;
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

  const district = activeData[activeDistrict] || activeData[0];
  if (!district) return null;



  // ─── Score Calculations ───────────────────────────────────────────────────
  function getSaScore(sa: ServiceAreaData) {
    let achieved = 0;
    let thumbsUp = 0;
    const metrics: { label: string; value: number }[] = [];

    configs.forEach((mc) => {
      const metric = (sa.summary as any)[mc.key];
      if (!metric) return;
      const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(',', '.'));

      if (!isNaN(realVal)) {
        if (isMetricAchieved(realVal, mc)) {
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

  function getStoScore(sto: STOData) {
    let achieved = 0;
    let thumbsUp = 0;
    const metrics: { label: string; value: number }[] = [];

    configs.forEach((mc) => {
      const metric = (sto as any)[mc.key];
      if (!metric) return;
      const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(',', '.'));

      if (!isNaN(realVal)) {
        if (isMetricAchieved(realVal, mc)) {
          achieved++;
          const formattedVal = realVal % 1 === 0 ? realVal : Number(realVal.toFixed(2));
          metrics.push({ label: mc.shortLabel, value: formattedVal });
        }
      }
      if (metric.trend === "🟢") thumbsUp++;
    });
    return { sto, achieved, thumbsUp, metrics };
  }

  // 1. Overall Best SA
  const allSAsWithScores = activeData.flatMap((d) =>
    d.serviceAreas.map((sa) => ({ district: d.district, ...getSaScore(sa) }))
  );
  allSAsWithScores.sort((a, b) => {
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    return b.thumbsUp - a.thumbsUp;
  });
  const overallBestSA = allSAsWithScores[0];

  // 1.5 Overall Best STO
  const allSTOsWithScores = data.flatMap((d) =>
    d.serviceAreas.flatMap((sa) =>
      (sa.stos || []).map((sto) => ({
        district: d.district,
        sa: sa.serviceArea,
        ...getStoScore(sto),
      }))
    )
  );
  allSTOsWithScores.sort((a, b) => {
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    return b.thumbsUp - a.thumbsUp;
  });
  const overallBestSTO = allSTOsWithScores[0];

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
  const districtScores = activeData.map((d) => {
    let totalMetrics = 0;
    let totalAchieved = 0;
    d.serviceAreas.forEach((sa) => {
      const score = getSaScore(sa);
      totalAchieved += score.achieved;
      totalMetrics += configs.length;
    });
    const percentage =
      totalMetrics > 0 ? (totalAchieved / totalMetrics) * 100 : 0;
    return { district: d.district, percentage };
  });
  districtScores.sort((a, b) => b.percentage - a.percentage);
  districtScores.sort((a, b) => b.percentage - a.percentage);
  const top3Districts = districtScores.slice(0, 3);

  // 4. Best STO in Active District
  const activeDistrictSTOs = district.serviceAreas.flatMap((sa) => 
    (sa.stos || []).map((sto) => ({
      district: district.district,
      sa: sa.serviceArea,
      ...getStoScore(sto),
    }))
  );
  activeDistrictSTOs.sort((a, b) => {
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    return b.thumbsUp - a.thumbsUp;
  });
  const districtBestSTO = activeDistrictSTOs[0];

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

  const pieDataSTO = {
    labels: overallBestSTO?.metrics.map((m) => m.label) || [],
    datasets: [
      {
        data: overallBestSTO?.metrics.map((m) => m.value) || [],
        backgroundColor: [
          "rgba(168, 85, 247, 0.85)", // purple
          "rgba(249, 115, 22, 0.85)", // orange
          "rgba(20, 184, 166, 0.85)", // teal
          "rgba(236, 72, 153, 0.85)", // pink
          "rgba(99, 102, 241, 0.85)", // indigo
          "rgba(16, 185, 129, 0.85)", // emerald
          "rgba(59, 130, 246, 0.85)", // blue
          "rgba(245, 158, 11, 0.85)", // amber
          "rgba(239, 68, 68, 0.85)",  // red
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

  const averages = configs.map(mc => {
    const sum = district.serviceAreas.reduce((acc, sa) => {
      const real = (sa.summary as any)[mc.key]?.real || 0;
      return acc + (typeof real === 'number' ? real : parseFloat(String(real).replace(',', '.')) || 0);
    }, 0);
    const avg = district.serviceAreas.length > 0 ? sum / district.serviceAreas.length : 0;
    const target = mc.target;
    const diff = mc.isLowerBetter ? target - avg : avg - target;
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
            Report EBIS Eastern
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
      <div className="flex flex-col gap-5">
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

        {/* Widget 1.5: Global Best STO */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="mb-4 relative z-10">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-400" />
              Global Best STO
            </h3>
            <p className="text-[10px] text-foreground-muted mt-1">Highest parameters achieved across all STOs</p>
          </div>

          {overallBestSTO && (
            <div className="relative z-10 flex flex-col flex-1 h-[calc(100%-60px)]">
              <div className="flex items-center justify-between bg-[var(--surface-hover)] p-3 rounded-xl border border-[var(--border)] mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <span className="text-purple-400 font-bold text-sm tracking-widest">{overallBestSTO.sto.sto.substring(0, 3)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{overallBestSTO.sto.sto}</div>
                    <div className="text-[10px] text-purple-400 font-semibold">{overallBestSTO.district} ({overallBestSTO.sa})</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-purple-400 flex items-center justify-end gap-1">
                    {overallBestSTO.achieved} <Target className="w-3 h-3" />
                  </div>
                  <div className="text-[10px] text-purple-500/70">{overallBestSTO.thumbsUp} Positive</div>
                </div>
              </div>
              <div className="h-[140px] w-full relative">
                <Doughnut data={pieDataSTO} options={pieOptions} />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <div className="text-lg font-bold text-blue-400">{districtBestSA.achieved} <span className="text-[10px] text-foreground-muted">/ {configs.length}</span></div>
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

        {/* Widget 4: Best STO per District */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="mb-4 relative z-10">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              Best STO in {district.district}
            </h3>
            <p className="text-[10px] text-foreground-muted mt-1">Top performing STO in current district</p>
          </div>

          {districtBestSTO && (
            <div className="relative z-10 flex flex-col flex-1 justify-center">
              <div className="bg-[var(--surface-hover)] p-5 rounded-xl border border-[var(--border)] relative overflow-hidden">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
                    <span className="text-violet-400 font-bold text-lg tracking-widest">{districtBestSTO.sto.sto.substring(0, 3)}</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{districtBestSTO.sto.sto}</div>
                    <div className="text-xs text-violet-400 mt-0.5">SA: {districtBestSTO.sa}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)] text-center flex flex-col justify-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <Target className="w-3 h-3 text-violet-400" /> Targets
                    </div>
                    <div className="text-lg font-bold text-violet-400">{districtBestSTO.achieved} <span className="text-[10px] text-foreground-muted">/ {configs.length}</span></div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)] text-center flex flex-col justify-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <ThumbsUp className="w-3 h-3 text-violet-400" /> Trends
                    </div>
                    <div className="text-lg font-bold text-violet-400">{districtBestSTO.thumbsUp} <span className="text-[10px] text-foreground-muted">pos</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Monthly EBIS Trend Section */}
      <MonthlyEbisTrendSection
        districtName={district.district}
        trendData={trendData || null}
        districtServiceAreas={district.serviceAreas}
        configs={configs}
        mode={mode}
      />

      {/* District Tabs & Assurance / FF Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* District Selection */}
        <div className="glass-card p-1.5 flex gap-1.5 overflow-x-auto flex-1 max-w-xl">
          {activeData.map((d, idx) => (
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

        {/* Assurance vs Fulfillment Mode Toggle */}
        <div className="glass-card p-1.5 flex items-center gap-1.5 self-start md:self-auto shrink-0 shadow-sm">
          <button
            onClick={() => setMode("FF")}
            className={cn(
              "px-4 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
              mode === "FF"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                : "text-foreground-muted hover:bg-[var(--surface-hover)] hover:text-foreground"
            )}
          >
            <span>Fulfillment (FF)</span>
          </button>
          <button
            onClick={() => setMode("ASSURANCE")}
            className={cn(
              "px-4 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
              mode === "ASSURANCE"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 scale-[1.02]"
                : "text-foreground-muted hover:bg-[var(--surface-hover)] hover:text-foreground"
            )}
          >
            <span>Assurance</span>
          </button>
        </div>
      </div>

      {/* ─── District Performance (from API districtSummary) ────────── */}
      {district.districtSummary && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-accent-blue" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                District Performance ({mode === "FF" ? "Fulfillment" : "Assurance"})
              </h2>
              <span className="text-[10px] text-foreground-muted font-medium ml-1">
                — {district.district}
              </span>
            </div>

            <button
              onClick={() => setUnachievingOnly((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border shadow-sm cursor-pointer",
                unachievingOnly
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-rose-500/20 ring-2 ring-rose-500/40"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300"
              )}
              title={unachievingOnly ? "Show All Data" : "Filter Unachieving / Red Only"}
            >
              <AlertTriangle className={cn("w-3.5 h-3.5 text-rose-500", unachievingOnly && "animate-pulse")} />
              <span>Unachieving / Red Only</span>
              {unachievingOnly && (
                <span className="ml-1 text-[9px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                  ACTIVE
                </span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {configs.filter(c => !unachievingOnly || isMetricUnachieving((district.districtSummary as any)[c.key], c)).map((card) => {
              const metric = (district.districtSummary as any)[card.key];
              if (!metric) return null;

              const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(',', '.'));
              const h1Val = typeof metric.h1 === "number" ? metric.h1 : parseFloat(String(metric.h1).replace(',', '.'));
              const isAchieved = isMetricAchieved(realVal, card);

              const trendColors = getTrendColor(metric.trend);
              let trendArrow = "=";
              if (metric.trend === "🟢") trendArrow = "↑";
              else if (metric.trend === "🔴") trendArrow = "↓";

              return (
                <div
                  key={card.key}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02] group",
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

                  {/* Label + Target badge */}
                  <div className="flex items-center justify-between mb-2.5 relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted leading-none truncate pr-1" title={card.label}>
                      {card.shortLabel}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-md leading-none shrink-0",
                        isAchieved
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      )}
                    >
                      T: {card.target.toFixed(2)}%
                    </span>
                  </div>

                  {/* Hero number */}
                  <div className="relative z-10 flex items-baseline gap-1">
                    <span className="text-[10px] font-medium text-foreground-muted leading-none">=</span>
                    <span
                      className={cn(
                        "text-xl font-extrabold tabular-nums leading-none tracking-tight",
                        isAchieved ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {!isNaN(realVal) ? `${realVal.toFixed(2)}%` : metric.real != null && metric.real !== "" ? `${metric.real}%` : "-"}
                    </span>
                  </div>

                  {/* Trend & H-1 */}
                  <div className="mt-2.5 flex items-center gap-1.5 relative z-10">
                    <span className={cn("text-xs font-black leading-none", trendColors.text)}>
                      {trendArrow}
                    </span>
                    <span className="text-[10px] text-foreground-muted tabular-nums">
                      H-1: {!isNaN(h1Val) ? `${h1Val.toFixed(2)}%` : metric.h1 != null && metric.h1 !== "" ? `${metric.h1}%` : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {unachievingOnly && configs.every(c => !isMetricUnachieving((district.districtSummary as any)[c.key], c)) && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              All District level metrics achieved target!
            </div>
          )}
        </div>
      )}

      {/* Service Area Cards */}
      <div className="space-y-4">
        {district.serviceAreas
          .filter((sa) => {
            if (!unachievingOnly) return true;
            const saUnachieving = hasRecordUnachieving(sa.summary);
            const stoUnachieving = sa.stos.some((sto) => hasRecordUnachieving(sto));
            return saUnachieving || stoUnachieving;
          })
          .map((sa) => (
            <ServiceAreaCard key={sa.serviceArea} sa={sa} configs={configs} unachievingOnly={unachievingOnly} />
          ))}
      </div>

      {/* Raw Data Table */}
      <div className="glass-card p-5 mt-10" ref={tableRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">
            Raw Data Table ({mode === "FF" ? "Fulfillment" : "Assurance"})
          </h3>
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors border border-blue-500/20"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 font-semibold sticky left-0 z-20 bg-[var(--surface-hover)] min-w-[150px] max-w-[150px]">Service Area</th>
                <th className="px-4 py-3 font-semibold sticky left-[150px] z-20 bg-[var(--surface-hover)] min-w-[80px] max-w-[80px] shadow-[1px_0_0_0_var(--border)]">STO</th>
                {configs.map((mc, idx) => (
                  <th key={mc.key} className={cn("px-4 py-3 font-semibold text-center", idx !== 0 && "border-l-2 border-[var(--border)]")} colSpan={mc.count1 && mc.count2 ? 6 : 4}>{mc.shortLabel}</th>
                ))}
              </tr>
              <tr className="border-b border-[var(--border)] text-xs text-foreground-muted bg-[var(--surface-hover)]/30">
                <th className="px-4 py-2 sticky left-0 z-20 bg-[var(--surface-hover)] min-w-[150px] max-w-[150px]"></th>
                <th className="px-4 py-2 sticky left-[150px] z-20 bg-[var(--surface-hover)] min-w-[80px] max-w-[80px] shadow-[1px_0_0_0_var(--border)]"></th>
                {configs.map((mc, idx) => (
                  <Fragment key={mc.key}>
                    <th className={cn("px-4 py-2 text-center", idx !== 0 && "border-l-2 border-[var(--border)]")}>Real</th>
                    <th className="px-4 py-2 text-center border-l border-[var(--border)]/30">Target</th>
                    <th className="px-4 py-2 text-center border-l border-[var(--border)]/30">Ach</th>
                    <th className="px-4 py-2 text-center border-l border-[var(--border)]/30">Trend</th>
                    {mc.count1 && <th className="px-4 py-2 text-center border-l border-[var(--border)]/30">{mc.count1.label}</th>}
                    {mc.count2 && <th className="px-4 py-2 text-center border-l border-[var(--border)]/30">{mc.count2.label}</th>}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {district.serviceAreas.flatMap(sa => 
                sa.stos
                  .filter(sto => !unachievingOnly || hasRecordUnachieving(sto))
                  .map(sto => (
                  <tr key={sto.sto} className="group hover:bg-[var(--surface-hover)]/50 transition-colors">
                    <td className="px-4 py-2 sticky left-0 z-10 bg-[var(--surface)] group-hover:bg-[var(--surface-hover)] transition-colors min-w-[150px] max-w-[150px] truncate" title={sa.serviceArea}>{sa.serviceArea}</td>
                    <td className="px-4 py-2 font-medium sticky left-[150px] z-10 bg-[var(--surface)] group-hover:bg-[var(--surface-hover)] transition-colors min-w-[80px] max-w-[80px] shadow-[1px_0_0_0_var(--border)]">{sto.sto}</td>
                    {configs.map((mc, idx) => {
                      const m = (sto as any)[mc.key];
                      const target = mc.target;
                      const count1Val = mc.count1 ? m?.[mc.count1.key] : undefined;
                      const count2Val = mc.count2 ? m?.[mc.count2.key] : undefined;
                      const realVal = m ? (typeof m.real === 'number' ? m.real : parseFloat(String(m.real ?? "").replace(',', '.'))) : NaN;
                      const isAchieved = isMetricAchieved(realVal, mc);

                      if (unachievingOnly && isAchieved) {
                        return (
                          <Fragment key={mc.key}>
                            <td className={cn("px-4 py-2 text-center text-foreground-muted/20 text-xs", idx !== 0 && "border-l-2 border-[var(--border)]")}>-</td>
                            <td className="px-4 py-2 text-center border-l border-[var(--border)]/30 text-foreground-muted/20 text-xs">-</td>
                            <td className="px-4 py-2 text-center border-l border-[var(--border)]/30 text-foreground-muted/20 text-xs">-</td>
                            <td className="px-4 py-2 text-center border-l border-[var(--border)]/30 text-foreground-muted/20 text-xs">-</td>
                            {mc.count1 && <td className="px-4 py-2 text-center border-l border-[var(--border)]/30 text-foreground-muted/20 text-xs">-</td>}
                            {mc.count2 && <td className="px-4 py-2 text-center border-l border-[var(--border)]/30 text-foreground-muted/20 text-xs">-</td>}
                          </Fragment>
                        );
                      }

                      return (
                        <Fragment key={mc.key}>
                          <td className={cn("px-4 py-2 text-center font-bold text-rose-500", idx !== 0 && "border-l-2 border-[var(--border)]")}>
                            {m?.real != null ? (typeof m.real === 'number' ? m.real.toFixed(2) + '%' : String(m.real).endsWith('%') ? m.real : m.real + '%') : '-'}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-[var(--border)]/30">{target ?? '-'}</td>
                          <td className="px-4 py-2 text-center border-l border-[var(--border)]/30">
                            {typeof m?.ach === 'number' ? (m.ach * 100).toFixed(2) + '%' : (m?.ach ?? '-')}
                          </td>
                          <td className="px-4 py-2 text-center border-l border-[var(--border)]/30">{m?.trend ?? '-'}</td>
                          {mc.count1 && <td className="px-4 py-2 text-center border-l border-[var(--border)]/30">{count1Val ?? '-'}</td>}
                          {mc.count2 && <td className="px-4 py-2 text-center border-l border-[var(--border)]/30">{count2Val ?? '-'}</td>}
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
