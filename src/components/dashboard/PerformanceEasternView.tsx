"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  PerformanceEasternData,
  SegmentSummaryRow,
  IndicatorRow,
  PeriodMetric,
} from "@/types/performance-eastern";
import { useReportIHEastern } from "@/hooks/useReportIHEastern";
import { METRIC_CONFIGS, WSA_TARGETS, type ServiceAreaData, type STOData } from "@/types/report-ih-eastern";
import {
  Trophy,
  Medal,
  Crown,
  Target,
  ThumbsUp,
  TrendingUp,
  Search,
  Filter,
  Download,
  Flame,
  Layers,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useTheme } from "@/components/ThemeProvider";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PerformanceEasternViewProps {
  data: PerformanceEasternData;
}

type SummaryVariationKey = "standard" | "naDianggapAch" | "naDiexclude";
type DistrictFilterKey = "ALL" | "BOGOR" | "BEKASI" | "KARAWANG";
type PeriodKey = "CURRENT" | "PREV";

const SEGMEN_COLORS: Record<string, { bg: string; text: string; border: string; chartColor: string }> = {
  NETWORK: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30", chartColor: "rgba(6, 182, 212, 0.85)" },
  ENTERPRISE: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", chartColor: "rgba(168, 85, 247, 0.85)" },
  EBIS: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", chartColor: "rgba(168, 85, 247, 0.85)" },
  WSA: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", chartColor: "rgba(16, 185, 129, 0.85)" },
  CNOP: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", chartColor: "rgba(245, 158, 11, 0.85)" },
  OLO: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", chartColor: "rgba(59, 130, 246, 0.85)" },
};

function parsePercent(val: string): number {
  if (!val) return 0;
  const clean = val.replace("%", "").replace(",", ".").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function getSaScore(sa: ServiceAreaData) {
  let achieved = 0;
  let thumbsUp = 0;
  METRIC_CONFIGS.forEach((mc) => {
    const metric = sa.summary[mc.key];
    if (!metric) return;
    const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(",", "."));
    const target = WSA_TARGETS[mc.key] || 0;
    if (!isNaN(realVal) && realVal >= target) achieved++;
    if (metric.trend === "🟢") thumbsUp++;
  });
  return { sa, achieved, thumbsUp };
}

function getStoScore(sto: STOData) {
  let achieved = 0;
  let thumbsUp = 0;
  METRIC_CONFIGS.forEach((mc) => {
    const metric = (sto as any)[mc.key];
    if (!metric) return;
    const realVal = typeof metric.real === "number" ? metric.real : parseFloat(String(metric.real).replace(",", "."));
    const target = WSA_TARGETS[mc.key] || 0;
    if (!isNaN(realVal) && realVal >= target) achieved++;
    if (metric.trend === "🟢") thumbsUp++;
  });
  return { sto, achieved, thumbsUp };
}

export function PerformanceEasternView({ data }: PerformanceEasternViewProps) {
  const { theme } = useTheme();
  const { data: wisaData } = useReportIHEastern();

  // State
  const selectedVariation: SummaryVariationKey = "standard";
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("CURRENT");
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictFilterKey>("ALL");
  const [selectedSegmen, setSelectedSegmen] = useState<string>("ALL");
  const [racingFilter, setRacingFilter] = useState<"ALL" | "RACING" | "NON_RACING">("ALL");
  const [achFilter, setAchFilter] = useState<"ALL" | "ACH" | "NOT_ACH">("ALL");
  const [displayLimit, setDisplayLimit] = useState<"ALL" | "TOP10">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const currentSummaryList: SegmentSummaryRow[] = useMemo(() => {
    return data.summaries[selectedVariation] || [];
  }, [data.summaries, selectedVariation]);

  const totalRow = useMemo(() => {
    return (
      currentSummaryList.find((s) => s.segmen.toUpperCase().includes("TOTAL")) ||
      currentSummaryList[currentSummaryList.length - 1]
    );
  }, [currentSummaryList]);

  // District rankings based on Total Row
  const districtRankings = useMemo(() => {
    if (!totalRow) return [];
    const districts: ("bogor" | "bekasi" | "karawang")[] = ["bogor", "bekasi", "karawang"];
    const items = districts.map((key) => {
      const metric = totalRow.districts[key];
      const percentNum = parsePercent(metric.percent);
      return {
        key: key.toUpperCase() as DistrictFilterKey,
        name: key.toUpperCase(),
        percentStr: metric.percent || "0%",
        percentNum,
        ach: Number(metric.ach) || 0,
        notAch: Number(metric.notAch) || 0,
        na: Number(metric.na) || 0,
        total: Number(metric.total) || 0,
      };
    });

    return items.sort((a, b) => {
      if (b.percentNum !== a.percentNum) return b.percentNum - a.percentNum;
      return b.ach - a.ach;
    });
  }, [totalRow]);

  // WISA Best SA & STO for active district
  const wisaDistrictStats = useMemo(() => {
    if (selectedDistrict === "ALL" || !wisaData) return null;

    const matchedDist = wisaData.find((d) =>
      d.district.toUpperCase().includes(selectedDistrict.toUpperCase())
    );
    if (!matchedDist) return null;

    const scoredSAs = matchedDist.serviceAreas
      .map((sa) => ({ district: matchedDist.district, ...getSaScore(sa) }))
      .sort((a, b) => (b.achieved !== a.achieved ? b.achieved - a.achieved : b.thumbsUp - a.thumbsUp));

    const scoredSTOs = matchedDist.serviceAreas
      .flatMap((sa) =>
        (sa.stos || []).map((sto) => ({
          district: matchedDist.district,
          sa: sa.serviceArea,
          ...getStoScore(sto),
        }))
      )
      .sort((a, b) => (b.achieved !== a.achieved ? b.achieved - a.achieved : b.thumbsUp - a.thumbsUp));

    return {
      bestSA: scoredSAs[0] || null,
      bestSTO: scoredSTOs[0] || null,
      totalSAs: matchedDist.serviceAreas.length,
      totalSTOs: scoredSTOs.length,
    };
  }, [selectedDistrict, wisaData]);

  // Segments breakdown for Eastern Doughnut chart
  const segmentChartData = useMemo(() => {
    const segRows = currentSummaryList.filter((s) => !s.segmen.toUpperCase().includes("TOTAL"));
    const labels: string[] = [];
    const values: number[] = [];
    const bgColors: string[] = [];

    segRows.forEach((row) => {
      const metric = selectedPeriod === "CURRENT" ? row.currentMonth : row.prevMonth;
      const pNum = parsePercent(metric.percent);
      labels.push(row.segmen);
      values.push(pNum);
      const conf = SEGMEN_COLORS[row.segmen.toUpperCase()] || { chartColor: "rgba(148, 163, 184, 0.85)" };
      bgColors.push(conf.chartColor);
    });

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: bgColors,
          borderColor: theme === "dark" ? "rgba(15, 23, 42, 0.9)" : "#ffffff",
          borderWidth: 2,
        },
      ],
    };
  }, [currentSummaryList, selectedPeriod, theme]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.8)" : "#475569",
          font: { size: 10, weight: 600 as any },
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
        padding: 8,
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  // Best segment in active district (fallback / supplement)
  const districtBestSegment = useMemo(() => {
    if (selectedDistrict === "ALL" || !totalRow) return null;
    const distKey = selectedDistrict.toLowerCase() as "bogor" | "bekasi" | "karawang";

    let best = { segmen: "-", percent: "0%", pNum: -1, ach: 0, total: 0 };
    currentSummaryList.forEach((s) => {
      if (s.segmen.toUpperCase().includes("TOTAL")) return;
      const m = s.districts[distKey];
      const pNum = parsePercent(m.percent);
      if (pNum > best.pNum) {
        best = { segmen: s.segmen, percent: m.percent, pNum, ach: Number(m.ach) || 0, total: Number(m.total) || 0 };
      }
    });
    return best;
  }, [selectedDistrict, totalRow, currentSummaryList]);

  // Unique Segments list for Segment tabs
  const segmentTabs = useMemo(() => {
    const list = ["ALL", "WSA", "CNOP", "EBIS", "OLO", "NETWORK"];
    return list;
  }, []);

  // Filtered indicators
  const filteredIndicators = useMemo(() => {
    let result = data.indicators.filter((ind) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ind.indikator.toLowerCase().includes(q);
        const matchSeg = ind.segmen.toLowerCase().includes(q);
        if (!matchName && !matchSeg) return false;
      }

      // Segmen tab filter
      if (selectedSegmen !== "ALL") {
        const seg = ind.segmen.toUpperCase();
        if (selectedSegmen === "EBIS" && seg !== "ENTERPRISE" && seg !== "EBIS") return false;
        if (selectedSegmen !== "EBIS" && seg !== selectedSegmen) return false;
      }

      // Racing filter
      if (racingFilter === "RACING" && !ind.kpiRacing) return false;
      if (racingFilter === "NON_RACING" && ind.kpiRacing) return false;

      // Ach filter
      if (achFilter !== "ALL") {
        let achVal: number = 0;
        if (selectedDistrict === "BOGOR") {
          achVal = typeof ind.bogor.ach === "number" ? ind.bogor.ach : parseFloat(String(ind.bogor.ach || 0));
        } else if (selectedDistrict === "BEKASI") {
          achVal = typeof ind.bekasi.ach === "number" ? ind.bekasi.ach : parseFloat(String(ind.bekasi.ach || 0));
        } else if (selectedDistrict === "KARAWANG") {
          achVal = typeof ind.karawang.ach === "number" ? ind.karawang.ach : parseFloat(String(ind.karawang.ach || 0));
        } else {
          achVal = typeof ind.eastern.ach === "number" ? ind.eastern.ach : parseFloat(String(ind.eastern.ach || 0));
        }
        const isAchieved = !isNaN(achVal) && achVal >= 100;
        if (achFilter === "ACH" && !isAchieved) return false;
        if (achFilter === "NOT_ACH" && isAchieved) return false;
      }

      return true;
    });

    // Top 10 Limit toggle
    if (displayLimit === "TOP10") {
      result = [...result]
        .sort((a, b) => {
          const achA = typeof a.eastern.ach === "number" ? a.eastern.ach : parseFloat(String(a.eastern.ach || 0));
          const achB = typeof b.eastern.ach === "number" ? b.eastern.ach : parseFloat(String(b.eastern.ach || 0));
          return achB - achA;
        })
        .slice(0, 10);
    }

    return result;
  }, [data.indicators, searchQuery, selectedSegmen, racingFilter, achFilter, selectedDistrict, displayLimit]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "No",
      "Indikator",
      "Segmen",
      "Target",
      "Eastern Real",
      "Eastern Ach",
      "Bogor Real",
      "Bogor Ach",
      "Bekasi Real",
      "Bekasi Ach",
      "Karawang Real",
      "Karawang Ach",
      "KPI Racing",
    ];

    const csvRows = [headers.join(",")];
    filteredIndicators.forEach((ind) => {
      csvRows.push(
        [
          ind.no,
          `"${ind.indikator.replace(/"/g, '""')}"`,
          `"${ind.segmen}"`,
          ind.target ?? "",
          ind.eastern.real ?? "",
          ind.eastern.ach ?? "",
          ind.bogor.real ?? "",
          ind.bogor.ach ?? "",
          ind.bekasi.real ?? "",
          ind.bekasi.ach ?? "",
          ind.karawang.real ?? "",
          ind.karawang.ach ?? "",
          ind.kpiRacing ? "YES" : "NO",
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `performance_eastern_${selectedDistrict}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const easternMetric = selectedPeriod === "CURRENT" ? totalRow?.currentMonth : totalRow?.prevMonth;
  const periodLabel = selectedPeriod === "CURRENT" ? data.periods.currentPeriod : data.periods.prevPeriod;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Header & Global Controls ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/10 text-accent-blue uppercase tracking-wider border border-accent-blue/20">
              Region Eastern Area 2
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            Performance Eastern
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Fulfillment & Assurance performance by regional Eastern and head-to-head 3 District.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Link to Leaderboard */}
          <Link
            href="/performance-eastern/leaderboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Leaderboard 50 KPI
          </Link>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl px-2 py-1">
            <span className="text-[10px] text-foreground-muted font-semibold uppercase px-1">Periode:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as PeriodKey)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="CURRENT" className="bg-[var(--surface)] text-foreground">
                {data.periods.currentPeriod || "W2 Oktober 2026"}
              </option>
              <option value="PREV" className="bg-[var(--surface)] text-foreground">
                {data.periods.prevPeriod || "FM September 2026"}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── District Filter Buttons (TANPA FILTER vs DGN FILTER) ─────────────── */}
      <div className="glass-card p-1.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider px-3">
          District Filter:
        </span>
        <button
          onClick={() => setSelectedDistrict("ALL")}
          className={cn(
            "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
            selectedDistrict === "ALL"
              ? "bg-accent-blue text-white shadow-md shadow-blue-500/20"
              : "bg-[var(--surface-hover)] text-foreground-muted hover:text-foreground border border-[var(--border)]"
          )}
        >
          Semua District (POV Eastern)
        </button>
        {(["BOGOR", "BEKASI", "KARAWANG"] as DistrictFilterKey[]).map((dist) => (
          <button
            key={dist}
            onClick={() => setSelectedDistrict(dist)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
              selectedDistrict === dist
                ? "bg-accent-blue text-white shadow-md shadow-blue-500/20"
                : "bg-[var(--surface-hover)] text-foreground-muted hover:text-foreground border border-[var(--border)]"
            )}
          >
            {dist === "BOGOR" ? "BOGOR - SUKABUMI" : dist}
          </button>
        ))}
      </div>

      {/* ─── Top Cards (Dynamic: Tanpa Filter vs Dgn Filter) ──────────────────── */}
      {selectedDistrict === "ALL" ? (
        /* ─── KONDISI TANPA FILTER ─── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card Kiri: Best Regional di Area 2 (Eastern POV) */}
          <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

            <div className="flex items-start justify-between relative z-10 mb-4">
              <div>
                <span className="text-[10px] font-bold text-accent-blue uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-accent-blue" />
                  Best Regional di Area 2
                </span>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  Eastern Region Performance
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {periodLabel} • Evaluasi 5 Segmen Utama
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-foreground tabular-nums">
                  {easternMetric?.percent || "0%"}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold">
                  {easternMetric?.ach ?? 0} dari {easternMetric?.total ?? 0} KPI Achieved
                </div>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 items-center gap-4 mt-2">
              <div className="h-[150px] w-full relative flex items-center justify-center">
                <Doughnut data={segmentChartData} options={doughnutOptions} />
              </div>

              <div className="space-y-1.5">
                {currentSummaryList
                  .filter((s) => !s.segmen.toUpperCase().includes("TOTAL"))
                  .map((row) => {
                    const m = selectedPeriod === "CURRENT" ? row.currentMonth : row.prevMonth;
                    const c = SEGMEN_COLORS[row.segmen.toUpperCase()] || {
                      text: "text-foreground",
                      bg: "bg-zinc-500/10",
                      border: "border-zinc-500/20",
                    };
                    return (
                      <div
                        key={row.segmen}
                        className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs"
                      >
                        <span className={cn("font-bold text-[11px]", c.text)}>{row.segmen}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-foreground-muted tabular-nums">
                            {m.ach}/{m.total}
                          </span>
                          <span className="font-extrabold text-foreground tabular-nums">{m.percent}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Card Kanan: Best District (Top 3 Podium) */}
          <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -mr-12 -mb-12 pointer-events-none" />

            <div className="flex items-start justify-between relative z-10 mb-2">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Best District
                </span>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  Top 3 District Racing Podium
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Berdasarkan persentase capaian 50 KPI Racing
                </p>
              </div>

              <Link
                href="/performance-eastern/leaderboard"
                className="text-xs text-accent-blue hover:underline flex items-center gap-1 font-semibold"
              >
                Detail Head-to-Head <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Podium Visual */}
            <div className="relative z-10 flex items-end justify-center gap-2 pt-6 pb-1">
              {/* 2nd Place (Left) */}
              {districtRankings[1] && (
                <div className="flex flex-col items-center w-1/3">
                  <div className="text-center mb-3 w-full">
                    <div className="text-xs font-bold text-foreground truncate px-1" title={districtRankings[1].name}>
                      {districtRankings[1].name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-extrabold tabular-nums mt-0.5">
                      {districtRankings[1].percentStr}
                    </div>
                    <div className="text-[9px] text-foreground-muted">
                      {districtRankings[1].ach} KPI Ach
                    </div>
                  </div>
                  <div className="w-full bg-slate-400 border-t border-slate-300 rounded-t-xl h-20 flex items-start justify-center pt-2 relative">
                    <span className="text-slate-900 font-black text-xl">2</span>
                    <div className="absolute -top-3.5 bg-[var(--surface)] rounded-full p-1 border border-[var(--border)] shadow-md">
                      <Medal className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place (Center) */}
              {districtRankings[0] && (
                <div className="flex flex-col items-center w-1/3 z-10">
                  <div className="text-center mb-4 w-full">
                    <div className="text-sm font-black text-amber-400 truncate px-1" title={districtRankings[0].name}>
                      {districtRankings[0].name}
                    </div>
                    <div className="inline-block text-xs text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full mt-0.5 border border-amber-500/30 tabular-nums">
                      {districtRankings[0].percentStr}
                    </div>
                    <div className="text-[9px] text-foreground-muted mt-0.5">
                      {districtRankings[0].ach} KPI Ach
                    </div>
                  </div>
                  <div className="w-full bg-amber-500 border-t-2 border-amber-300 rounded-t-xl h-28 flex items-start justify-center pt-2 relative shadow-[0_-5px_20px_rgba(251,191,36,0.25)]">
                    <span className="text-amber-950 font-black text-2xl">1</span>
                    <div className="absolute -top-4 bg-[var(--surface)] rounded-full p-1.5 border border-amber-500/30 shadow-lg shadow-amber-500/20">
                      <Crown className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place (Right) */}
              {districtRankings[2] && (
                <div className="flex flex-col items-center w-1/3">
                  <div className="text-center mb-3 w-full">
                    <div className="text-xs font-bold text-foreground truncate px-1" title={districtRankings[2].name}>
                      {districtRankings[2].name}
                    </div>
                    <div className="text-[11px] text-amber-600 font-extrabold tabular-nums mt-0.5">
                      {districtRankings[2].percentStr}
                    </div>
                    <div className="text-[9px] text-foreground-muted">
                      {districtRankings[2].ach} KPI Ach
                    </div>
                  </div>
                  <div className="w-full bg-amber-700 border-t border-amber-600 rounded-t-xl h-16 flex items-start justify-center pt-2 relative">
                    <span className="text-amber-50 font-black text-lg">3</span>
                    <div className="absolute -top-3.5 bg-[var(--surface)] rounded-full p-1 border border-[var(--border)] shadow-md">
                      <Medal className="w-3.5 h-3.5 text-amber-700" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── KONDISI DENGAN FILTER DISTRICT ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Kiri: Best SA in District */}
          <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <div className="mb-4 relative z-10">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                Best SA in {selectedDistrict}
              </span>
              <h3 className="text-base font-bold text-foreground mt-0.5">
                Top Performing Service Area
              </h3>
              <p className="text-xs text-foreground-muted">
                Berdasarkan parameter KPI Web WISA di {selectedDistrict}
              </p>
            </div>

            {wisaDistrictStats?.bestSA ? (
              <div className="relative z-10 bg-[var(--surface-hover)] p-5 rounded-2xl border border-[var(--border)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <span className="text-blue-400 font-black text-lg tracking-wider">
                      {wisaDistrictStats.bestSA.sa.serviceArea.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-foreground">
                      {wisaDistrictStats.bestSA.sa.serviceArea}
                    </div>
                    <div className="text-xs text-blue-400 font-semibold mt-0.5">
                      Exceptional Performance
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)] text-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <Target className="w-3 h-3 text-blue-400" /> Targets
                    </div>
                    <div className="text-lg font-black text-blue-400 tabular-nums">
                      {wisaDistrictStats.bestSA.achieved}{" "}
                      <span className="text-[10px] text-foreground-muted font-normal">/ {METRIC_CONFIGS.length}</span>
                    </div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)] text-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <ThumbsUp className="w-3 h-3 text-blue-400" /> Trends
                    </div>
                    <div className="text-lg font-black text-blue-400 tabular-nums">
                      {wisaDistrictStats.bestSA.thumbsUp}{" "}
                      <span className="text-[10px] text-foreground-muted font-normal">pos</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback to Best Segment if WISA SA not yet available */
              <div className="relative z-10 bg-[var(--surface-hover)] p-5 rounded-2xl border border-[var(--border)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <span className="text-blue-400 font-black text-base">
                      {districtBestSegment?.segmen.substring(0, 3)}
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-foreground">
                      Segmen {districtBestSegment?.segmen}
                    </div>
                    <div className="text-xs text-blue-400 font-semibold mt-0.5">
                      Best Performing Segment di {selectedDistrict}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)] text-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1">
                      Achievement
                    </div>
                    <div className="text-xl font-black text-emerald-400 tabular-nums">
                      {districtBestSegment?.percent}
                    </div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)] text-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1">
                      KPI Racing Achieved
                    </div>
                    <div className="text-xl font-black text-foreground tabular-nums">
                      {districtBestSegment?.ach} / {districtBestSegment?.total}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card Kanan: Best STO in District */}
          <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <div className="mb-4 relative z-10">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                Best STO in {selectedDistrict}
              </span>
              <h3 className="text-base font-bold text-foreground mt-0.5">
                Top Performing STO
              </h3>
              <p className="text-xs text-foreground-muted">
                Berdasarkan parameter KPI Web WISA di {selectedDistrict}
              </p>
            </div>

            {wisaDistrictStats?.bestSTO ? (
              <div className="relative z-10 bg-[var(--surface-hover)] p-5 rounded-2xl border border-[var(--border)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <span className="text-purple-400 font-black text-lg tracking-wider">
                      {wisaDistrictStats.bestSTO.sto.sto.substring(0, 3)}
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-foreground">
                      STO {wisaDistrictStats.bestSTO.sto.sto}
                    </div>
                    <div className="text-xs text-purple-400 font-semibold mt-0.5">
                      SA: {wisaDistrictStats.bestSTO.sa}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)] text-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <Target className="w-3 h-3 text-purple-400" /> Targets
                    </div>
                    <div className="text-lg font-black text-purple-400 tabular-nums">
                      {wisaDistrictStats.bestSTO.achieved}{" "}
                      <span className="text-[10px] text-foreground-muted font-normal">/ {METRIC_CONFIGS.length}</span>
                    </div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)] text-center">
                    <div className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <ThumbsUp className="w-3 h-3 text-purple-400" /> Trends
                    </div>
                    <div className="text-lg font-black text-purple-400 tabular-nums">
                      {wisaDistrictStats.bestSTO.thumbsUp}{" "}
                      <span className="text-[10px] text-foreground-muted font-normal">pos</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback Summary for District */
              <div className="relative z-10 bg-[var(--surface-hover)] p-5 rounded-2xl border border-[var(--border)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <span className="text-purple-400 font-black text-lg">
                      {selectedDistrict.substring(0, 3)}
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-foreground">
                      District {selectedDistrict}
                    </div>
                    <div className="text-xs text-purple-400 font-semibold mt-0.5">
                      Realisasi 50 KPI Racing
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[var(--surface)] rounded-xl p-2.5 border border-[var(--border)]">
                    <div className="text-[9px] text-foreground-muted uppercase font-semibold">Achieved</div>
                    <div className="text-base font-black text-emerald-400 tabular-nums mt-0.5">
                      {totalRow?.districts[selectedDistrict.toLowerCase() as "bogor" | "bekasi" | "karawang"].ach ?? 0}
                    </div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-xl p-2.5 border border-[var(--border)]">
                    <div className="text-[9px] text-foreground-muted uppercase font-semibold">Not Ach</div>
                    <div className="text-base font-black text-rose-400 tabular-nums mt-0.5">
                      {totalRow?.districts[selectedDistrict.toLowerCase() as "bogor" | "bekasi" | "karawang"].notAch ?? 0}
                    </div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-xl p-2.5 border border-[var(--border)]">
                    <div className="text-[9px] text-foreground-muted uppercase font-semibold">Persentase</div>
                    <div className="text-base font-black text-accent-blue tabular-nums mt-0.5">
                      {totalRow?.districts[selectedDistrict.toLowerCase() as "bogor" | "bekasi" | "karawang"].percent || "0%"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Segment Tabs ("HANYA ANGKA DR WEB WISA") ────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-accent-blue" />
            Filter Segmen (POV Web WISA):
          </span>
          <span className="text-[10px] text-foreground-muted font-medium">
            Pilih segmen untuk memfilter tabel
          </span>
        </div>

        <div className="glass-card p-1.5 flex flex-wrap gap-1.5">
          {segmentTabs.map((seg) => {
            const isActive = selectedSegmen === seg;
            const segCount =
              seg === "ALL"
                ? data.indicators.length
                : data.indicators.filter((i) => {
                    const s = i.segmen.toUpperCase();
                    if (seg === "EBIS") return s === "ENTERPRISE" || s === "EBIS";
                    return s === seg;
                  }).length;

            return (
              <button
                key={seg}
                onClick={() => setSelectedSegmen(seg)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  isActive
                    ? "bg-accent-blue text-white shadow-md shadow-blue-500/25"
                    : "bg-[var(--surface-hover)] text-foreground hover:bg-[var(--surface)] border border-[var(--border)]"
                )}
              >
                <span>{seg === "ALL" ? "Semua Segmen" : seg}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-[var(--surface)] text-foreground-muted"
                  )}
                >
                  {segCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Table POV Eastern (Sampai District) with Filters & Controls ─────── */}
      <div className="glass-card p-6 space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                Table POV Eastern
              </span>
              <span className="text-xs text-foreground-muted font-medium">
                (Sampai District: Eastern, Bogor, Bekasi, Karawang)
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground mt-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Detail Head-to-Head Indikator KPI
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Menampilkan {filteredIndicators.length} dari {data.indicators.length} indikator KPI.
              {selectedDistrict !== "ALL" && (
                <span className="text-accent-blue font-semibold ml-1">
                  (Fokus District: {selectedDistrict})
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Top 10 vs All Toggle */}
            <div className="glass-card p-1 flex gap-1 rounded-xl">
              <button
                onClick={() => setDisplayLimit("TOP10")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  displayLimit === "TOP10"
                    ? "bg-accent-blue text-white shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                Top 10
              </button>
              <button
                onClick={() => setDisplayLimit("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  displayLimit === "ALL"
                    ? "bg-accent-blue text-white shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                Semua
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-semibold text-foreground hover:bg-[var(--surface)] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-accent-blue" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari indikator (1-90)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>

          {/* Racing Filter */}
          <div>
            <select
              value={racingFilter}
              onChange={(e) => setRacingFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="ALL">Semua Indikator (90 KPI)</option>
              <option value="RACING">Hanya 50 KPI Racing</option>
              <option value="NON_RACING">Non Racing (40 KPI)</option>
            </select>
          </div>

          {/* Ach Status Filter */}
          <div>
            <select
              value={achFilter}
              onChange={(e) => setAchFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="ALL">Semua Status Capaian</option>
              <option value="ACH">Achieved Target (≥ 100%)</option>
              <option value="NOT_ACH">Needs Attention (&lt; 100%)</option>
            </select>
          </div>
        </div>

        {/* The Head-to-Head Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] max-h-[580px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)]">
              <tr className="text-foreground-muted">
                <th className="px-3 py-3 font-semibold text-center w-12">NO</th>
                <th className="px-4 py-3 font-semibold min-w-[260px]">INDIKATOR</th>
                <th className="px-3 py-3 font-semibold text-center">SEGMEN</th>
                <th className="px-3 py-3 font-semibold text-center">TIPE</th>
                <th className="px-3 py-3 font-semibold text-right">TARGET</th>
                <th className="px-3 py-3 font-semibold text-center bg-accent-blue/10 text-accent-blue">
                  EASTERN
                </th>
                <th
                  className={cn(
                    "px-3 py-3 font-semibold text-center transition-colors",
                    selectedDistrict === "BOGOR" && "bg-accent-blue/15 text-accent-blue font-bold"
                  )}
                >
                  BOGOR
                </th>
                <th
                  className={cn(
                    "px-3 py-3 font-semibold text-center transition-colors",
                    selectedDistrict === "BEKASI" && "bg-accent-blue/15 text-accent-blue font-bold"
                  )}
                >
                  BEKASI
                </th>
                <th
                  className={cn(
                    "px-3 py-3 font-semibold text-center transition-colors",
                    selectedDistrict === "KARAWANG" && "bg-accent-blue/15 text-accent-blue font-bold"
                  )}
                >
                  KARAWANG
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredIndicators.map((ind, idx) => {
                const segColor = SEGMEN_COLORS[ind.segmen.toUpperCase()] || {
                  bg: "bg-zinc-500/10",
                  text: "text-zinc-400",
                  border: "border-zinc-500/20",
                };

                const easternAch = typeof ind.eastern.ach === "number" ? ind.eastern.ach : parseFloat(String(ind.eastern.ach || 0));
                const bogorAch = typeof ind.bogor.ach === "number" ? ind.bogor.ach : parseFloat(String(ind.bogor.ach || 0));
                const bekasiAch = typeof ind.bekasi.ach === "number" ? ind.bekasi.ach : parseFloat(String(ind.bekasi.ach || 0));
                const karawangAch = typeof ind.karawang.ach === "number" ? ind.karawang.ach : parseFloat(String(ind.karawang.ach || 0));

                return (
                  <tr key={`ind-${ind.no}-${idx}`} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-3 py-3 text-center text-foreground-muted font-mono">{ind.no}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="leading-snug" title={ind.indikator}>
                        {ind.indikator}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border",
                          segColor.bg,
                          segColor.text,
                          segColor.border
                        )}
                      >
                        {ind.segmen}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {ind.kpiRacing ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          RACING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-500/10 text-foreground-muted border border-zinc-500/20">
                          NON RACING
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-foreground whitespace-nowrap">
                      {ind.target ?? "-"}
                    </td>

                    {/* Eastern */}
                    <td className="px-3 py-3 text-center whitespace-nowrap bg-accent-blue/5">
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          !isNaN(easternAch) && easternAch >= 100 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {ind.eastern.ach !== null ? `${ind.eastern.ach}%` : "-"}
                      </span>
                    </td>

                    {/* Bogor */}
                    <td
                      className={cn(
                        "px-3 py-3 text-center whitespace-nowrap",
                        selectedDistrict === "BOGOR" && "bg-accent-blue/10"
                      )}
                    >
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          !isNaN(bogorAch) && bogorAch >= 100 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {ind.bogor.ach !== null ? `${ind.bogor.ach}%` : "-"}
                      </span>
                    </td>

                    {/* Bekasi */}
                    <td
                      className={cn(
                        "px-3 py-3 text-center whitespace-nowrap",
                        selectedDistrict === "BEKASI" && "bg-accent-blue/10"
                      )}
                    >
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          !isNaN(bekasiAch) && bekasiAch >= 100 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {ind.bekasi.ach !== null ? `${ind.bekasi.ach}%` : "-"}
                      </span>
                    </td>

                    {/* Karawang */}
                    <td
                      className={cn(
                        "px-3 py-3 text-center whitespace-nowrap",
                        selectedDistrict === "KARAWANG" && "bg-accent-blue/10"
                      )}
                    >
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          !isNaN(karawangAch) && karawangAch >= 100 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {ind.karawang.ach !== null ? `${ind.karawang.ach}%` : "-"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredIndicators.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-foreground-muted">
                    Tidak ada indikator yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
