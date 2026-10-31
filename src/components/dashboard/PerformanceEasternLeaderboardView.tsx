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
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Layers,
  Search,
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";

interface PerformanceEasternLeaderboardViewProps {
  data: PerformanceEasternData;
}

type SummaryVariationKey = "standard" | "naDianggapAch" | "naDiexclude";

interface DistrictRankItem {
  district: "BOGOR" | "BEKASI" | "KARAWANG";
  name: string;
  percentStr: string;
  percentNum: number;
  ach: number;
  notAch: number;
  na: number;
  total: number;
  bestSegment: { segmen: string; percent: string };
}

const SEGMEN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NETWORK: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  ENTERPRISE: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  WSA: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  CNOP: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  OLO: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
};

function parsePercent(val: string): number {
  if (!val) return 0;
  const clean = val.replace("%", "").replace(",", ".").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function PerformanceEasternLeaderboardView({ data }: PerformanceEasternLeaderboardViewProps) {
  const [selectedVariation, setSelectedVariation] = useState<SummaryVariationKey>("standard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegmen, setSelectedSegmen] = useState<string>("ALL");
  const [racingFilter, setRacingFilter] = useState<"ALL" | "RACING" | "NON_RACING">("ALL");

  const currentSummaryList: SegmentSummaryRow[] = useMemo(() => {
    return data.summaries[selectedVariation] || [];
  }, [data.summaries, selectedVariation]);

  const totalRow = useMemo(() => {
    return (
      currentSummaryList.find((s) => s.segmen.toUpperCase().includes("TOTAL")) ||
      currentSummaryList[currentSummaryList.length - 1]
    );
  }, [currentSummaryList]);

  // Compute District Rankings
  const districtRankings: DistrictRankItem[] = useMemo(() => {
    if (!totalRow) return [];

    const districts: ("bogor" | "bekasi" | "karawang")[] = ["bogor", "bekasi", "karawang"];

    const items: DistrictRankItem[] = districts.map((key) => {
      const metric = totalRow.districts[key];
      const percentNum = parsePercent(metric.percent);

      // Find best performing segment for this district
      let bestSeg = { segmen: "-", percent: "0%", num: -1 };
      currentSummaryList.forEach((s) => {
        if (s.segmen.toUpperCase().includes("TOTAL")) return;
        const pNum = parsePercent(s.districts[key].percent);
        if (pNum > bestSeg.num) {
          bestSeg = { segmen: s.segmen, percent: s.districts[key].percent, num: pNum };
        }
      });

      return {
        district: key.toUpperCase() as any,
        name: key.toUpperCase(),
        percentStr: metric.percent || "0%",
        percentNum,
        ach: Number(metric.ach) || 0,
        notAch: Number(metric.notAch) || 0,
        na: Number(metric.na) || 0,
        total: Number(metric.total) || 0,
        bestSegment: { segmen: bestSeg.segmen, percent: bestSeg.percent },
      };
    });

    // Sort by percentNum descending, then by ach descending
    return items.sort((a, b) => {
      if (b.percentNum !== a.percentNum) return b.percentNum - a.percentNum;
      return b.ach - a.ach;
    });
  }, [totalRow, currentSummaryList]);

  // Filtered Indicators (defaults to all 90 indicators)
  const filteredIndicators = useMemo(() => {
    return data.indicators.filter((ind) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!ind.indikator.toLowerCase().includes(q)) return false;
      }
      if (selectedSegmen !== "ALL" && ind.segmen.toUpperCase() !== selectedSegmen) {
        return false;
      }
      if (racingFilter === "RACING" && !ind.kpiRacing) return false;
      if (racingFilter === "NON_RACING" && ind.kpiRacing) return false;
      return true;
    });
  }, [data.indicators, searchQuery, selectedSegmen, racingFilter]);

  // Segments list
  const segments = useMemo(() => {
    const set = new Set<string>();
    data.indicators.forEach((i) => {
      if (i.segmen) set.add(i.segmen.toUpperCase());
    });
    return Array.from(set);
  }, [data.indicators]);

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
    const rows = [headers.join(",")];
    filteredIndicators.forEach((ind) => {
      rows.push(
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

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `leaderboard_indicators_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRankBadge = (rankIdx: number) => {
    if (rankIdx === 0) {
      return {
        badge: "🥇 RANK 1",
        border: "border-amber-400/40 bg-gradient-to-b from-amber-500/10 via-[var(--surface)] to-transparent",
        iconColor: "text-amber-400",
        ringColor: "ring-amber-400/30",
      };
    }
    if (rankIdx === 1) {
      return {
        badge: "🥈 RANK 2",
        border: "border-slate-300/40 bg-gradient-to-b from-slate-400/10 via-[var(--surface)] to-transparent",
        iconColor: "text-slate-300",
        ringColor: "ring-slate-400/30",
      };
    }
    return {
      badge: "🥉 RANK 3",
      border: "border-amber-700/40 bg-gradient-to-b from-amber-700/10 via-[var(--surface)] to-transparent",
      iconColor: "text-amber-600",
      ringColor: "ring-amber-700/30",
    };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Top Header & Controls ────────────────────────────────────────── */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/performance-eastern"
              className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Performance Eastern
            </Link>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            Leaderboard 50 KPI Racing District
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Peringkat dan evaluasi performa 3 District (Bogor, Bekasi, Karawang) berdasarkan 50 KPI Racing.
          </p>
        </div>

        {/* Variation Switcher */}
        <div className="glass-card p-1 flex gap-1 rounded-xl self-start md:self-auto">
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

      {/* ─── Podium Cards (Rank 1, 2, 3) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {districtRankings.map((item, idx) => {
          const style = getRankBadge(idx);

          return (
            <div
              key={item.district}
              className={cn(
                "glass-card p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between",
                style.border
              )}
            >
              {/* Badge Rank */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border",
                    style.iconColor,
                    style.ringColor
                  )}
                >
                  {style.badge}
                </span>
                <span className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                  50 KPI RACING
                </span>
              </div>

              {/* District Name & Achievement */}
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                  DISTRICT {item.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
                    {item.percentStr}
                  </span>
                  <span className="text-xs text-foreground-muted">Pencapaian Racing</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[var(--surface-hover)] h-2 rounded-full mt-3 overflow-hidden border border-[var(--border)]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.percentNum >= 80
                        ? "bg-emerald-500"
                        : item.percentNum >= 50
                        ? "bg-accent-blue"
                        : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min(100, item.percentNum)}%` }}
                  />
                </div>
              </div>

              {/* Statistics Breakdown */}
              <div className="mt-6 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[10px] text-foreground-muted uppercase font-semibold">ACH</div>
                  <div className="text-base font-bold text-emerald-400 tabular-nums">{item.ach}</div>
                </div>
                <div className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <div className="text-[10px] text-foreground-muted uppercase font-semibold">NOT ACH</div>
                  <div className="text-base font-bold text-rose-400 tabular-nums">{item.notAch}</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-500/5 border border-zinc-500/20">
                  <div className="text-[10px] text-foreground-muted uppercase font-semibold">TOTAL</div>
                  <div className="text-base font-bold text-foreground tabular-nums">{item.total}</div>
                </div>
              </div>

              {/* Best Segment Callout */}
              <div className="mt-4 px-3 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between text-xs">
                <span className="text-foreground-muted text-[11px]">Best Segmen:</span>
                <span className="font-bold text-foreground">
                  {item.bestSegment.segmen} ({item.bestSegment.percent})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Segment Matrix Comparison ────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-blue" />
              Perbandingan Pencapaian per Segmen
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Rincian performa ketiga district pada masing-masing segmen bisnis.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--surface-hover)] text-foreground-muted border-b border-[var(--border)]">
                <th className="px-4 py-3 font-semibold">SEGMEN</th>
                <th className="px-4 py-3 text-center font-semibold text-emerald-400">BOGOR</th>
                <th className="px-4 py-3 text-center font-semibold text-blue-400">BEKASI</th>
                <th className="px-4 py-3 text-center font-semibold text-purple-400">KARAWANG</th>
                <th className="px-4 py-3 text-center font-semibold">LEADER SEGMEN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {currentSummaryList.map((row, idx) => {
                const isTotal = row.segmen.toUpperCase().includes("TOTAL");
                const bVal = parsePercent(row.districts.bogor.percent);
                const kVal = parsePercent(row.districts.karawang.percent);
                const bkVal = parsePercent(row.districts.bekasi.percent);

                const maxVal = Math.max(bVal, kVal, bkVal);
                let leader = "SEIMBANG (TIE)";
                if (bVal > bkVal && bVal > kVal) leader = "BOGOR";
                else if (bkVal > bVal && bkVal > kVal) leader = "BEKASI";
                else if (kVal > bVal && kVal > bkVal) leader = "KARAWANG";

                return (
                  <tr
                    key={`matrix-${idx}`}
                    className={cn(
                      "transition-colors",
                      isTotal ? "bg-accent-blue/10 font-bold" : "hover:bg-[var(--surface-hover)]"
                    )}
                  >
                    <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                      {row.segmen}
                    </td>

                    {/* Bogor */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="font-bold tabular-nums text-foreground">
                        {row.districts.bogor.percent}
                      </div>
                      <div className="text-[10px] text-foreground-muted tabular-nums">
                        {row.districts.bogor.ach} / {row.districts.bogor.total}
                      </div>
                    </td>

                    {/* Bekasi */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="font-bold tabular-nums text-foreground">
                        {row.districts.bekasi.percent}
                      </div>
                      <div className="text-[10px] text-foreground-muted tabular-nums">
                        {row.districts.bekasi.ach} / {row.districts.bekasi.total}
                      </div>
                    </td>

                    {/* Karawang */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="font-bold tabular-nums text-foreground">
                        {row.districts.karawang.percent}
                      </div>
                      <div className="text-[10px] text-foreground-muted tabular-nums">
                        {row.districts.karawang.ach} / {row.districts.karawang.total}
                      </div>
                    </td>

                    {/* Leader */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                        {leader}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Detailed Indicators Table ─────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Detail Head-to-Head Indikator KPI
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Menampilkan {filteredIndicators.length} dari {data.indicators.length} indikator KPI (Bogor, Bekasi, Karawang).
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-semibold text-foreground hover:bg-[var(--surface)] transition-colors self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-accent-blue" />
            Export CSV ({filteredIndicators.length})
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

          <div>
            <select
              value={selectedSegmen}
              onChange={(e) => setSelectedSegmen(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="ALL">Semua Segmen ({data.indicators.length})</option>
              {segments.map((seg) => (
                <option key={seg} value={seg}>
                  Segmen {seg}
                </option>
              ))}
            </select>
          </div>

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
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)]">
              <tr className="text-foreground-muted">
                <th className="px-3 py-3 font-semibold text-center w-12">NO</th>
                <th className="px-4 py-3 font-semibold min-w-[260px]">INDIKATOR</th>
                <th className="px-3 py-3 font-semibold text-center">SEGMEN</th>
                <th className="px-3 py-3 font-semibold text-center">TIPE</th>
                <th className="px-3 py-3 font-semibold text-right">TARGET</th>
                <th className="px-3 py-3 font-semibold text-center bg-accent-blue/5">EASTERN</th>
                <th className="px-3 py-3 font-semibold text-center">BOGOR</th>
                <th className="px-3 py-3 font-semibold text-center">BEKASI</th>
                <th className="px-3 py-3 font-semibold text-center">KARAWANG</th>
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
                    <td className="px-3 py-3 text-center whitespace-nowrap">
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
                    <td className="px-3 py-3 text-center whitespace-nowrap">
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
                    <td className="px-3 py-3 text-center whitespace-nowrap">
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

