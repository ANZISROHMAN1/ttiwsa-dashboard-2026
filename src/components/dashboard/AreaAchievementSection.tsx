"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { AreaAchievementData } from "@/types/area-achievement";
import type { LeaderboardWisaData } from "@/types/leaderboard-wisa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Trophy,
  Flame,
  Download,
  RefreshCw,
  Sparkles,
  BarChart3,
  MapPin,
  TrendingUp,
  Layers,
  CheckCircle2,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

interface AreaAchievementSectionProps {
  data: AreaAchievementData;
  wisaData?: LeaderboardWisaData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function AreaAchievementSection({
  data,
  wisaData,
  isLoading = false,
  onRefresh,
}: AreaAchievementSectionProps) {
  // Toggle states
  const [kpiCategory, setKpiCategory] = useState<"non-racing" | "racing">("non-racing");
  const [metricMode, setMetricMode] = useState<"achRate" | "kpi">("achRate");
  const [scopeMode, setScopeMode] = useState<"regional" | "area">("regional");

  // Racing Regional Dataset aggregated from wisaData (or fallback)
  const racingRegionalData = useMemo(() => {
    if (wisaData?.districts && wisaData.districts.length > 0) {
      const regMap: Record<
        string,
        {
          regional: string;
          area: string;
          achRateSum: number;
          count: number;
          achievedSum: number;
          totalSum: number;
        }
      > = {};

      wisaData.districts.forEach((d) => {
        const reg = d.regional || "OTHER";
        if (!regMap[reg]) {
          regMap[reg] = {
            regional: reg,
            area: d.area,
            achRateSum: 0,
            count: 0,
            achievedSum: 0,
            totalSum: 0,
          };
        }
        const rate = parseFloat(String(d.achRate).replace("%", "").trim()) || 0;
        regMap[reg].achRateSum += rate;
        regMap[reg].count += 1;
        regMap[reg].achievedSum += d.achieved;
        regMap[reg].totalSum += d.total - d.na;
      });

      const list = Object.values(regMap).map((r) => {
        const avgRate = r.count > 0 ? r.achRateSum / r.count : 0;
        return {
          rank: 0,
          regional: r.regional,
          name: r.regional.replace(/^\d+-/, ""),
          area: r.area,
          achRate: parseFloat(avgRate.toFixed(2)),
          kpiAchieved: Math.round(r.achievedSum / r.count),
          totalKpi: Math.round(r.totalSum / r.count) || 50,
          isEastern: r.regional.toUpperCase().includes("EASTERN"),
        };
      });

      list.sort((a, b) => b.achRate - a.achRate);
      list.forEach((item, idx) => {
        item.rank = idx + 1;
      });

      return list.sort((a, b) => a.regional.localeCompare(b.regional));
    }

    // Fallback baseline for Racing Regional
    return [
      { rank: 5, regional: "01-SUMBAGUT", name: "SUMBAGUT", area: "AREA 1", achRate: 64.2, kpiAchieved: 32, totalKpi: 50 },
      { rank: 8, regional: "02-SUMBAGTENG", name: "SUMBAGTENG", area: "AREA 1", achRate: 62.8, kpiAchieved: 31, totalKpi: 50 },
      { rank: 4, regional: "03-SUMBAGSEL", name: "SUMBAGSEL", area: "AREA 1", achRate: 71.8, kpiAchieved: 36, totalKpi: 50 },
      { rank: 3, regional: "04-JAKARTA & BANTEN", name: "JAKARTA & BANTEN", area: "AREA 2", achRate: 76.2, kpiAchieved: 38, totalKpi: 50 },
      { rank: 7, regional: "05-JABAR", name: "JABAR", area: "AREA 2", achRate: 68.2, kpiAchieved: 34, totalKpi: 50 },
      { rank: 2, regional: "06-EASTERN JABOTABEK", name: "EASTERN JABOTABEK", area: "AREA 2", achRate: 79.81, kpiAchieved: 40, totalKpi: 50, isEastern: true },
      { rank: 6, regional: "07-JATENG DIY", name: "JATENG DIY", area: "AREA 3", achRate: 74.5, kpiAchieved: 37, totalKpi: 50 },
      { rank: 1, regional: "08-JATIM", name: "JATIM", area: "AREA 3", achRate: 85.5, kpiAchieved: 43, totalKpi: 50 },
      { rank: 12, regional: "09-BALINUSRA", name: "BALINUSRA", area: "AREA 3", achRate: 58.9, kpiAchieved: 29, totalKpi: 50 },
      { rank: 9, regional: "10-KALIMANTAN", name: "KALIMANTAN", area: "AREA 4", achRate: 69.4, kpiAchieved: 35, totalKpi: 50 },
      { rank: 10, regional: "11-SULAWESI", name: "SULAWESI", area: "AREA 4", achRate: 66.5, kpiAchieved: 33, totalKpi: 50 },
      { rank: 11, regional: "12-MALUKU PAPUA", name: "MALUKU PAPUA", area: "AREA 4", achRate: 61.5, kpiAchieved: 31, totalKpi: 50 },
    ];
  }, [wisaData]);

  // Racing Area Dataset
  const racingAreaData = useMemo(() => {
    const areaMap: Record<
      string,
      {
        area: string;
        name: string;
        achRateSum: number;
        count: number;
        achievedSum: number;
        totalSum: number;
      }
    > = {};

    racingRegionalData.forEach((r) => {
      if (!areaMap[r.area]) {
        areaMap[r.area] = {
          area: r.area,
          name: `${r.area}`,
          achRateSum: 0,
          count: 0,
          achievedSum: 0,
          totalSum: 0,
        };
      }
      areaMap[r.area].achRateSum += r.achRate;
      areaMap[r.area].count += 1;
      areaMap[r.area].achievedSum += r.kpiAchieved;
      areaMap[r.area].totalSum += r.totalKpi;
    });

    const list = Object.values(areaMap).map((a) => ({
      rank: 0,
      area: a.area,
      name: a.area,
      achRate: parseFloat((a.achRateSum / a.count).toFixed(2)),
      kpiAchieved: Math.round(a.achievedSum / a.count),
      totalKpi: Math.round(a.totalSum / a.count) || 50,
    }));

    list.sort((a, b) => b.achRate - a.achRate);
    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    return list.sort((a, b) => a.area.localeCompare(b.area));
  }, [racingRegionalData]);

  // Active Datasets based on selected KPI Category (Non-Racing vs Racing)
  const activeRegionalData = kpiCategory === "racing" ? racingRegionalData : data.regional;
  const activeAreaData = kpiCategory === "racing" ? racingAreaData : data.area;

  // Eastern item
  const easternRegional = useMemo(() => {
    return activeRegionalData.find((r) => r.isEastern || r.regional.includes("EASTERN"));
  }, [activeRegionalData]);

  // Current list for Podium and Table (sorted by metric)
  const currentList = useMemo(() => {
    if (scopeMode === "regional") {
      return [...activeRegionalData].sort((a, b) => {
        if (metricMode === "achRate") return b.achRate - a.achRate;
        return b.kpiAchieved - a.kpiAchieved;
      });
    }
    return [...activeAreaData].sort((a, b) => {
      if (metricMode === "achRate") return b.achRate - a.achRate;
      return b.kpiAchieved - a.kpiAchieved;
    });
  }, [activeRegionalData, activeAreaData, scopeMode, metricMode]);

  // Chart dataset in code order (01 to 12)
  const chartItems = useMemo(() => {
    if (scopeMode === "regional") {
      return activeRegionalData;
    }
    return activeAreaData;
  }, [activeRegionalData, activeAreaData, scopeMode]);

  const labels = useMemo(() => {
    return chartItems.map((item) => ("regional" in item ? item.regional : item.name));
  }, [chartItems]);

  const values = useMemo(() => {
    return chartItems.map((item) =>
      metricMode === "achRate" ? item.achRate : item.kpiAchieved
    );
  }, [chartItems, metricMode]);

  const backgroundColors = useMemo(() => {
    return chartItems.map((item) => {
      const isEastern =
        scopeMode === "regional"
          ? "regional" in item &&
            (Boolean((item as any).isEastern) || String((item as any).regional).includes("EASTERN"))
          : item.area === "AREA 2";
      if (isEastern) {
        return "rgba(37, 99, 235, 0.9)"; // Highlight biru khusus Regional Eastern Jabotabek
      }
      return "#4a6882"; // Warna slate-navy standar WISA
    });
  }, [chartItems, scopeMode]);

  const borderColors = useMemo(() => {
    return chartItems.map((item) => {
      const isEastern =
        scopeMode === "regional"
          ? "regional" in item &&
            (Boolean((item as any).isEastern) || String((item as any).regional).includes("EASTERN"))
          : item.area === "AREA 2";
      if (isEastern) {
        return "#60a5fa";
      }
      return "#38526a";
    });
  }, [chartItems, scopeMode]);

  // Chart configuration matching WISA screenshot
  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 4,
        barPercentage: 0.65,
        categoryPercentage: 0.8,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#f8fafc",
        bodyColor: "#93c5fd",
        borderColor: "rgba(148, 163, 184, 0.2)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            if (metricMode === "achRate") {
              return `Achievement: ${val.toFixed(2)}%`;
            }
            return `KPI Achieved: ${val} KPI`;
          },
        },
      },
      datalabels: {
        color: "#ffffff",
        anchor: "end" as const,
        align: "bottom" as const,
        offset: 8,
        font: {
          weight: "bold" as const,
          size: 11,
          family: "monospace",
        },
        formatter: (val: number) => {
          if (metricMode === "achRate") {
            return val.toFixed(2);
          }
          return `${val}`;
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: metricMode === "achRate" ? 100 : undefined,
        ticks: {
          stepSize: metricMode === "achRate" ? 20 : undefined,
          color: "rgba(148, 163, 184, 0.8)",
          font: { size: 11, weight: "bold" },
          callback: (value: any) =>
            metricMode === "achRate" ? `${Number(value).toFixed(2)}` : value,
        },
        grid: {
          color: "rgba(148, 163, 184, 0.12)",
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: "rgba(148, 163, 184, 0.9)",
          font: { size: 10, weight: "600" },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: { display: false },
      },
    },
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      "Rank",
      scopeMode === "regional" ? "Regional" : "Area",
      "Area TIF",
      "Achievement Rate (%)",
      "KPI Category",
    ];

    const rows: string[] = [headers.join(",")];
    currentList.forEach((item, idx) => {
      rows.push(
        [
          idx + 1,
          `"${"regional" in item ? item.regional : item.name}"`,
          `"${item.area}"`,
          item.achRate.toFixed(2),
          `"${kpiCategory.toUpperCase()}"`,
        ].join(",")
      );
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `area_achievement_${kpiCategory}_${scopeMode}_${data.week}_${data.month.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* Main Chart Card (Exact Layout Matching WISA Screenshot)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        {/* Top Controls Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          {/* Title & Subtitle */}
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Area Achievement
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                {data.week} • {data.month}
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">
              <span className="font-bold text-foreground">
                {scopeMode === "regional" ? "Regional Comparison" : "Area Comparison"}
              </span>{" "}
              <span>
                ({metricMode === "achRate" ? "Achievement %" : "Total Achieved KPI"} •{" "}
                <strong className={kpiCategory === "racing" ? "text-amber-400" : "text-emerald-400"}>
                  {kpiCategory === "racing" ? "Racing KPI" : "Non-Racing"}
                </strong>
                )
              </span>
            </p>
          </div>

          {/* Controls: Non-Racing / Racing Toggle, Ach Rate/KPI Toggle, Area/Regional Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* KPI Mode Switcher: Non-Racing vs Racing */}
            <div className="inline-flex items-center p-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl shadow-sm">
              <button
                onClick={() => setKpiCategory("non-racing")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  kpiCategory === "non-racing"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                )}
                title="Buka Data Evaluasi Non-Racing"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    kpiCategory === "non-racing" ? "bg-white" : "bg-emerald-400"
                  )}
                />
                Non-Racing KPI
              </button>
              <button
                onClick={() => setKpiCategory("racing")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  kpiCategory === "racing"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                )}
                title="Buka Data Evaluasi Racing KPI"
              >
                <Flame className="w-3.5 h-3.5" />
                Racing KPI
              </button>
            </div>

            {/* Toggle 1: Ach Rate vs KPI */}
            <div className="inline-flex items-center p-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl">
              <button
                onClick={() => setMetricMode("achRate")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  metricMode === "achRate"
                    ? "bg-[#182a3a] text-white shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                Ach Rate
              </button>
              <button
                onClick={() => setMetricMode("kpi")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  metricMode === "kpi"
                    ? "bg-[#182a3a] text-white shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                KPI
              </button>
            </div>

            {/* Toggle 2: Area vs Regional */}
            <div className="inline-flex items-center p-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl">
              <button
                onClick={() => setScopeMode("area")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  scopeMode === "area"
                    ? "bg-[#182a3a] text-white shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                Area
              </button>
              <button
                onClick={() => setScopeMode("regional")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  scopeMode === "regional"
                    ? "bg-[#182a3a] text-white shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                Regional
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition-all"
              title="Download Data CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-semibold text-foreground hover:bg-[var(--surface)] transition-colors"
                title="Refresh Data"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5 text-accent-blue", isLoading && "animate-spin")}
                />
              </button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* Eastern Jabotabek Spotlight Hero Banner                     */}
        {/* ─────────────────────────────────────────────────────────── */}
        {easternRegional && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-blue/20 via-accent-blue/10 to-transparent border border-accent-blue/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-accent-blue">
                  Pencapaian Regional EASTERN JABOTABEK
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {easternRegional.rank === 1
                    ? "🥇 RANK #1 NASIONAL"
                    : easternRegional.rank === 2
                    ? "🥈 RANK #2 NASIONAL"
                    : `RANK #${easternRegional.rank} NASIONAL`}
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                {kpiCategory === "non-racing" ? (
                  <>
                    Eastern Jabotabek meraih peringkat tertinggi ke-2 se-Indonesia dengan Achievement Rate{" "}
                    <span className="font-extrabold text-foreground">{easternRegional.achRate}%</span>{" "}
                    sesuai tabel evaluasi Regional (Non-Racing).
                  </>
                ) : (
                  <>
                    Eastern Jabotabek meraih peringkat ke-{easternRegional.rank} nasional pada evaluasi Racing KPI dengan rerata Achievement{" "}
                    <span className="font-extrabold text-foreground">{easternRegional.achRate}%</span>{" "}
                    (Karawang 89.80%, Bekasi 81.63%, Bogor 68.00%).
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-foreground-muted">
                  Achievement Rate
                </div>
                <div className="text-2xl font-black text-accent-blue">
                  {easternRegional.achRate}%
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center text-xl shadow-md">
                {easternRegional.rank === 1 ? "🥇" : easternRegional.rank === 2 ? "🥈" : "🏆"}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* Interactive Bar Chart                                       */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="w-full pt-2">
          <div className="h-[380px] sm:h-[420px] w-full relative">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Rankings Leaderboard Table & Podium Showcase                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 3 Podium (Left 1 col) */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-foreground">Top 3 Nasional</h3>
          </div>

          <div className="space-y-3">
            {currentList.slice(0, 3).map((item, idx) => {
              const isEastern: boolean =
                "isEastern" in item ? Boolean((item as any).isEastern) : item.area === "AREA 2";
              const displayName: string =
                "regional" in item ? String((item as any).regional) : String(item.name);
              return (
                <div
                  key={idx}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3",
                    idx === 0 && "bg-amber-500/10 border-amber-500/30",
                    idx === 1 && "bg-slate-300/10 border-slate-300/30",
                    idx === 2 && "bg-amber-700/10 border-amber-700/30",
                    isEastern && "ring-2 ring-accent-blue border-accent-blue"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                    <div>
                      <div
                        className={cn(
                          "text-xs font-black",
                          isEastern ? "text-accent-blue" : "text-foreground"
                        )}
                      >
                        {displayName}
                      </div>
                      <div className="text-[10px] text-foreground-muted">{item.area}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-foreground">
                      {item.achRate.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-foreground-muted font-mono">
                      Rank #{idx + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Rankings Table (Right 2 cols) */}
        <div className="glass-card p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent-blue" />
              <h3 className="text-base font-black text-foreground">
                Tabel Peringkat {scopeMode === "regional" ? "12 Regional" : "4 Area"} (
                {kpiCategory === "racing" ? "Racing KPI" : "Non-Racing"})
              </h3>
            </div>
            <span className="text-xs font-semibold text-foreground-muted">
              Diurutkan berdasarkan Achievement Rate
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-foreground-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 text-left font-bold">Rank</th>
                  <th className="py-2.5 px-3 text-left font-bold">
                    {scopeMode === "regional" ? "Regional" : "Area"}
                  </th>
                  <th className="py-2.5 px-3 text-left font-bold">Area TIF</th>
                  {metricMode === "kpi" && (
                    <th className="py-2.5 px-3 text-right font-bold">KPI Achieved</th>
                  )}
                  <th className="py-2.5 px-3 text-right font-bold">Achievement Rate</th>
                  <th className="py-2.5 px-3 text-left font-bold pl-4">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {currentList.map((item, idx) => {
                  const isEastern: boolean =
                    "isEastern" in item ? Boolean((item as any).isEastern) : item.area === "AREA 2";
                  const displayName: string =
                    "regional" in item ? String((item as any).regional) : String(item.name);
                  return (
                    <tr
                      key={idx}
                      className={cn(
                        "hover:bg-[var(--surface-hover)] transition-colors",
                        isEastern && "bg-accent-blue/10 font-bold"
                      )}
                    >
                      <td className="py-2.5 px-3 font-mono">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold",
                            idx === 0 && "bg-amber-500/20 text-amber-400",
                            idx === 1 && "bg-slate-300/20 text-slate-300",
                            idx === 2 && "bg-amber-700/20 text-amber-500",
                            idx > 2 && "text-foreground-muted"
                          )}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "font-extrabold",
                              isEastern ? "text-accent-blue" : "text-foreground"
                            )}
                          >
                            {displayName}
                          </span>
                          {isEastern && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-accent-blue text-white uppercase">
                              Eastern
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-foreground-muted font-mono">{item.area}</td>
                      {metricMode === "kpi" && (
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-bold text-foreground">{item.kpiAchieved}</span>
                          <span className="text-foreground-muted">/{item.totalKpi}</span>
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-foreground">
                        {item.achRate.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 pl-4">
                        <div className="w-24 bg-[var(--surface-hover)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isEastern ? "bg-accent-blue" : "bg-[#4a6882]"
                            )}
                            style={{ width: `${Math.min(item.achRate, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
