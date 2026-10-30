"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type {
  PerformanceEasternData,
  SegmentSummaryRow,
  IndicatorRow,
  PeriodMetric,
} from "@/types/performance-eastern";
import {
  Trophy,
  Target,
  TrendingUp,
  Search,
  Filter,
  Download,
  Flame,
  Layers,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

interface PerformanceEasternViewProps {
  data: PerformanceEasternData;
}

type SummaryVariationKey = "standard" | "naDianggapAch" | "naDiexclude";

const SEGMEN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NETWORK: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  ENTERPRISE: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  WSA: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  CNOP: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  OLO: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
};

function formatDisplayVal(val: any): string {
  if (val === null || val === undefined || val === "") return "-";
  if (typeof val === "number") {
    return val % 1 === 0 ? val.toString() : val.toFixed(2);
  }
  return String(val);
}

function formatPercentBadge(percentStr: string) {
  const num = parseFloat(percentStr.replace("%", "").replace(",", "."));
  if (isNaN(num)) return { num: 0, text: percentStr, color: "text-foreground-muted", bg: "bg-zinc-500/10" };

  if (num >= 85) {
    return { num, text: percentStr, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" };
  }
  if (num >= 70) {
    return { num, text: percentStr, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" };
  }
  if (num >= 50) {
    return { num, text: percentStr, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" };
  }
  return { num, text: percentStr, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" };
}

function MetricPill({ metric, label }: { metric: PeriodMetric; label?: string }) {
  const badge = formatPercentBadge(metric.percent);
  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-[10px] text-foreground-muted font-medium mb-0.5">{label}</span>}
      <div className={cn("px-2.5 py-1 rounded-lg border font-bold text-xs tabular-nums", badge.bg, badge.color)}>
        {metric.percent || "-"}
      </div>
      <div className="text-[10px] text-foreground-muted mt-1 tabular-nums">
        <span className="text-emerald-400 font-semibold">{metric.ach ?? 0}</span> / {metric.total ?? 0}
      </div>
    </div>
  );
}

export function PerformanceEasternView({ data }: PerformanceEasternViewProps) {
  const [selectedVariation, setSelectedVariation] = useState<SummaryVariationKey>("standard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegmen, setSelectedSegmen] = useState<string>("ALL");
  const [racingFilter, setRacingFilter] = useState<"ALL" | "RACING" | "NON_RACING">("ALL");
  const [achFilter, setAchFilter] = useState<"ALL" | "ACH" | "NOT_ACH">("ALL");

  const currentSummaryList: SegmentSummaryRow[] = useMemo(() => {
    return data.summaries[selectedVariation] || [];
  }, [data.summaries, selectedVariation]);

  const totalRow = useMemo(() => {
    return (
      currentSummaryList.find((s) => s.segmen.toUpperCase().includes("TOTAL")) ||
      currentSummaryList[currentSummaryList.length - 1]
    );
  }, [currentSummaryList]);

  // Unique Segments for filter
  const allSegments = useMemo(() => {
    const set = new Set<string>();
    data.indicators.forEach((i) => {
      if (i.segmen) set.add(i.segmen.toUpperCase());
    });
    return Array.from(set);
  }, [data.indicators]);

  // Filtered indicators
  const filteredIndicators = useMemo(() => {
    return data.indicators.filter((ind) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ind.indikator.toLowerCase().includes(q);
        const matchSeg = ind.segmen.toLowerCase().includes(q);
        if (!matchName && !matchSeg) return false;
      }

      // Segmen
      if (selectedSegmen !== "ALL" && ind.segmen.toUpperCase() !== selectedSegmen) {
        return false;
      }

      // Racing filter
      if (racingFilter === "RACING" && !ind.kpiRacing) return false;
      if (racingFilter === "NON_RACING" && ind.kpiRacing) return false;

      // Ach filter (based on Eastern achievement)
      if (achFilter !== "ALL") {
        const achNum = typeof ind.eastern.ach === "number" ? ind.eastern.ach : parseFloat(String(ind.eastern.ach || 0));
        const isAchieved = !isNaN(achNum) && achNum >= 100;
        if (achFilter === "ACH" && !isAchieved) return false;
        if (achFilter === "NOT_ACH" && isAchieved) return false;
      }

      return true;
    });
  }, [data.indicators, searchQuery, selectedSegmen, racingFilter, achFilter]);

  // Download CSV
  const handleExportCSV = () => {
    const headers = [
      "No",
      "Indikator",
      "Segmen",
      "Target",
      "Real Eastern",
      "Ach Eastern",
      "Real Bogor",
      "Ach Bogor",
      "Real Bekasi",
      "Ach Bekasi",
      "Real Karawang",
      "Ach Karawang",
      "KPI Racing",
    ];

    const csvRows = [headers.join(",")];
    filteredIndicators.forEach((ind) => {
      const row = [
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
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `performance_eastern_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Top Stats Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Eastern Total Performance */}
        <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between border-accent-blue/30 bg-gradient-to-br from-accent-blue/10 via-transparent to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-accent-blue uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-accent-blue" />
              Eastern Realisasi
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue font-semibold">
              {totalRow?.trend || "≈"}
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                {totalRow?.currentMonth.percent || "0%"}
              </div>
              <div className="text-xs text-foreground-muted mt-1">
                {totalRow?.currentMonth.ach ?? 0} dari {totalRow?.currentMonth.total ?? 0} KPI Achieved
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-foreground-muted uppercase">Bulan Lalu</div>
              <div className="text-xs font-bold text-foreground tabular-nums">
                {totalRow?.prevMonth.percent || "0%"}
              </div>
            </div>
          </div>
        </div>

        {/* Bogor 50 KPI Racing */}
        <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-400" />
              Bogor Racing
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
              50 Racing
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                {totalRow?.districts.bogor.percent || "0%"}
              </div>
              <div className="text-xs text-foreground-muted mt-1">
                {totalRow?.districts.bogor.ach ?? 0} Achieved
              </div>
            </div>
            <div className="text-right text-[11px] text-foreground-muted tabular-nums">
              <div>Not Ach: <span className="text-rose-400 font-semibold">{totalRow?.districts.bogor.notAch ?? 0}</span></div>
              <div>N/A: {totalRow?.districts.bogor.na ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Bekasi 50 KPI Racing */}
        <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-blue-400" />
              Bekasi Racing
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">
              50 Racing
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                {totalRow?.districts.bekasi.percent || "0%"}
              </div>
              <div className="text-xs text-foreground-muted mt-1">
                {totalRow?.districts.bekasi.ach ?? 0} Achieved
              </div>
            </div>
            <div className="text-right text-[11px] text-foreground-muted tabular-nums">
              <div>Not Ach: <span className="text-rose-400 font-semibold">{totalRow?.districts.bekasi.notAch ?? 0}</span></div>
              <div>N/A: {totalRow?.districts.bekasi.na ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Karawang 50 KPI Racing */}
        <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-purple-400" />
              Karawang Racing
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-semibold">
              50 Racing
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                {totalRow?.districts.karawang.percent || "0%"}
              </div>
              <div className="text-xs text-foreground-muted mt-1">
                {totalRow?.districts.karawang.ach ?? 0} Achieved
              </div>
            </div>
            <div className="text-right text-[11px] text-foreground-muted tabular-nums">
              <div>Not Ach: <span className="text-rose-400 font-semibold">{totalRow?.districts.karawang.notAch ?? 0}</span></div>
              <div>N/A: {totalRow?.districts.karawang.na ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section 1: Segment Performance Overview ─────────────────────── */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent-blue" />
              Ringkasan Realisasi per Segmen & District
            </h2>
            <p className="text-xs text-foreground-muted mt-1">
              Perbandingan performa antar periode dan evaluasi 50 KPI Racing per District.
            </p>
          </div>

          {/* Variation Selector Toggle */}
          <div className="glass-card p-1 flex gap-1 rounded-xl">
            <button
              onClick={() => setSelectedVariation("standard")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                selectedVariation === "standard"
                  ? "bg-accent-blue text-white shadow-md shadow-blue-500/20"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              Standard
            </button>
            <button
              onClick={() => setSelectedVariation("naDianggapAch")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                selectedVariation === "naDianggapAch"
                  ? "bg-accent-blue text-white shadow-md shadow-blue-500/20"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              NA dianggap ACH
            </button>
            <button
              onClick={() => setSelectedVariation("naDiexclude")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                selectedVariation === "naDiexclude"
                  ? "bg-accent-blue text-white shadow-md shadow-blue-500/20"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              NA diexclude
            </button>
          </div>
        </div>

        {/* 2 Tables: Side-by-side on large screens */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Table 1: Eastern Segments (7 cols) */}
          <div className="xl:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-accent-blue uppercase tracking-wider">
                Eastern Region Performance
              </h3>
              <span className="text-[11px] text-foreground-muted">
                {data.periods.currentPeriod}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-foreground-muted border-b border-[var(--border)]">
                    <th className="px-4 py-3 font-semibold">SEGMEN</th>
                    <th className="px-3 py-3 text-center font-semibold">{data.periods.prevPeriod}</th>
                    <th className="px-2 py-3 text-center font-semibold">TREND</th>
                    <th className="px-3 py-3 text-center font-semibold">{data.periods.currentPeriod}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {currentSummaryList.map((row, idx) => {
                    const isTotal = row.segmen.toUpperCase().includes("TOTAL");
                    const prevBadge = formatPercentBadge(row.prevMonth.percent);
                    const currBadge = formatPercentBadge(row.currentMonth.percent);

                    return (
                      <tr
                        key={`eastern-seg-${idx}`}
                        className={cn(
                          "transition-colors",
                          isTotal
                            ? "bg-accent-blue/10 font-bold"
                            : "hover:bg-[var(--surface-hover)]"
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                          {row.segmen}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <MetricPill metric={row.prevMonth} />
                        </td>
                        <td className="px-2 py-3 text-center font-bold text-sm">
                          <span
                            className={cn(
                              row.trend === "↑"
                                ? "text-emerald-400"
                                : row.trend === "↓"
                                ? "text-rose-400"
                                : "text-amber-400"
                            )}
                          >
                            {row.trend}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <MetricPill metric={row.currentMonth} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: District Racing (Bogor, Bekasi, Karawang) (6 cols) */}
          <div className="xl:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                District 50 KPI Racing
              </h3>
              <span className="text-[11px] text-foreground-muted">Evaluasi 3 District</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-foreground-muted border-b border-[var(--border)]">
                    <th className="px-4 py-3 font-semibold">SEGMEN</th>
                    <th className="px-3 py-3 text-center font-semibold">BOGOR</th>
                    <th className="px-3 py-3 text-center font-semibold">BEKASI</th>
                    <th className="px-3 py-3 text-center font-semibold">KARAWANG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {currentSummaryList.map((row, idx) => {
                    const isTotal = row.segmen.toUpperCase().includes("TOTAL");
                    return (
                      <tr
                        key={`district-seg-${idx}`}
                        className={cn(
                          "transition-colors",
                          isTotal
                            ? "bg-accent-blue/10 font-bold"
                            : "hover:bg-[var(--surface-hover)]"
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                          {row.segmen}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <MetricPill metric={row.districts.bogor} />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <MetricPill metric={row.districts.bekasi} />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <MetricPill metric={row.districts.karawang} />
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

      {/* ─── Section 2: Detailed KPI Indicators Table ─────────────────────── */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-blue" />
              Detail Indikator KPI Performance
            </h2>
            <p className="text-xs text-foreground-muted mt-1">
              Menampilkan {filteredIndicators.length} dari {data.indicators.length} indikator KPI.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-semibold text-foreground hover:bg-[var(--surface)] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-accent-blue" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama indikator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>

          {/* Segmen filter */}
          <div>
            <select
              value={selectedSegmen}
              onChange={(e) => setSelectedSegmen(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="ALL">Semua Segmen ({data.indicators.length})</option>
              {allSegments.map((seg) => (
                <option key={seg} value={seg}>
                  Segmen {seg}
                </option>
              ))}
            </select>
          </div>

          {/* Racing Filter */}
          <div>
            <select
              value={racingFilter}
              onChange={(e) => setRacingFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="ALL">Semua Status Racing</option>
              <option value="RACING">Hanya 50 KPI Racing</option>
              <option value="NON_RACING">Non Racing</option>
            </select>
          </div>

          {/* Ach Filter */}
          <div>
            <select
              value={achFilter}
              onChange={(e) => setAchFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="ALL">Semua Pencapaian</option>
              <option value="ACH">Achieved (≥ 100%)</option>
              <option value="NOT_ACH">Under Target (&lt; 100%)</option>
            </select>
          </div>
        </div>

        {/* Indicators Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)]">
              <tr className="text-foreground-muted">
                <th className="px-3 py-3 font-semibold text-center w-12">NO</th>
                <th className="px-4 py-3 font-semibold min-w-[280px]">INDIKATOR</th>
                <th className="px-3 py-3 font-semibold text-center">SEGMEN</th>
                <th className="px-3 py-3 font-semibold text-right">TARGET</th>
                <th className="px-3 py-3 font-semibold text-center bg-accent-blue/5">EASTERN</th>
                <th className="px-3 py-3 font-semibold text-center">BOGOR</th>
                <th className="px-3 py-3 font-semibold text-center">BEKASI</th>
                <th className="px-3 py-3 font-semibold text-center">KARAWANG</th>
                <th className="px-3 py-3 font-semibold text-center">RACING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredIndicators.map((ind) => {
                const segColor = SEGMEN_COLORS[ind.segmen.toUpperCase()] || {
                  bg: "bg-zinc-500/10",
                  text: "text-zinc-400",
                  border: "border-zinc-500/20",
                };

                const easternAchNum = typeof ind.eastern.ach === "number" ? ind.eastern.ach : parseFloat(String(ind.eastern.ach || 0));
                const isEasternAch = !isNaN(easternAchNum) && easternAchNum >= 100;

                return (
                  <tr key={`ind-${ind.no}`} className="hover:bg-[var(--surface-hover)] transition-colors">
                    {/* No */}
                    <td className="px-3 py-3 text-center text-foreground-muted tabular-nums font-mono">
                      {ind.no}
                    </td>

                    {/* Indikator name */}
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="leading-snug" title={ind.indikator}>
                        {ind.indikator}
                      </div>
                    </td>

                    {/* Segmen Badge */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          segColor.bg,
                          segColor.text,
                          segColor.border
                        )}
                      >
                        {ind.segmen}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="px-3 py-3 text-right font-mono font-medium text-foreground whitespace-nowrap">
                      {formatDisplayVal(ind.target)}
                    </td>

                    {/* Eastern Real & Ach */}
                    <td className="px-3 py-3 text-center whitespace-nowrap bg-accent-blue/5">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "font-bold tabular-nums",
                            isEasternAch ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {formatDisplayVal(ind.eastern.ach)}%
                        </span>
                        <span className="text-[10px] text-foreground-muted tabular-nums">
                          Real: {formatDisplayVal(ind.eastern.real)}
                        </span>
                      </div>
                    </td>

                    {/* Bogor Real & Ach */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatDisplayVal(ind.bogor.ach)}%
                        </span>
                        <span className="text-[10px] text-foreground-muted tabular-nums">
                          Real: {formatDisplayVal(ind.bogor.real)}
                        </span>
                      </div>
                    </td>

                    {/* Bekasi Real & Ach */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatDisplayVal(ind.bekasi.ach)}%
                        </span>
                        <span className="text-[10px] text-foreground-muted tabular-nums">
                          Real: {formatDisplayVal(ind.bekasi.real)}
                        </span>
                      </div>
                    </td>

                    {/* Karawang Real & Ach */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatDisplayVal(ind.karawang.ach)}%
                        </span>
                        <span className="text-[10px] text-foreground-muted tabular-nums">
                          Real: {formatDisplayVal(ind.karawang.real)}
                        </span>
                      </div>
                    </td>

                    {/* KPI Racing */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {ind.kpiRacing ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Flame className="w-3 h-3" />
                          RACING
                        </span>
                      ) : (
                        <span className="text-[10px] text-foreground-muted font-medium">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredIndicators.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-foreground-muted">
                    Tidak ada indikator KPI yang sesuai dengan kriteria filter.
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

