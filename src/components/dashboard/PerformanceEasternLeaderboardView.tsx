"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PerformanceEasternData, SegmentSummaryRow } from "@/types/performance-eastern";
import { useLeaderboardWisa } from "@/hooks/useLeaderboardWisa";
import type { DistrictRacingItem } from "@/types/leaderboard-wisa";
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
  ChevronDown,
  ChevronUp,
  Building2,
  MapPin,
  Sparkles,
  BarChart3,
  RefreshCw,
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

const EASTERN_DISTRICTS = ["BOGOR", "BEKASI", "KARAWANG"];

export function PerformanceEasternLeaderboardView({ data }: PerformanceEasternLeaderboardViewProps) {
  // WISA Hook
  const { data: wisaData, isLoading: wisaLoading, error: wisaError, refetch: refetchWisa } = useLeaderboardWisa();

  // Tab switcher: "wisa" (61 District) vs "eastern" (3 District Eastern)
  const [activeTab, setActiveTab] = useState<"wisa" | "eastern">("wisa");

  // Filter state for WISA tab
  const [wisaSearch, setWisaSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const [selectedRegional, setSelectedRegional] = useState<string>("ALL");
  const [onlyEastern, setOnlyEastern] = useState<boolean>(false);
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

  // Eastern internal view state
  const selectedVariation: SummaryVariationKey = "standard";
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

  // Compute District Rankings (Eastern 3 districts)
  const districtRankings: DistrictRankItem[] = useMemo(() => {
    if (!totalRow) return [];

    const districts: ("bogor" | "bekasi" | "karawang")[] = ["bogor", "bekasi", "karawang"];

    const items: DistrictRankItem[] = districts.map((key) => {
      const metric = totalRow.districts[key];
      const percentNum = parsePercent(metric.percent);

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

    return items.sort((a, b) => {
      if (b.percentNum !== a.percentNum) return b.percentNum - a.percentNum;
      return b.ach - a.ach;
    });
  }, [totalRow, currentSummaryList]);

  // Filtered Indicators for Eastern 90 indicators
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

  // Filtered WISA Districts (61 districts)
  const filteredWisaDistricts = useMemo(() => {
    if (!wisaData?.districts) return [];

    return wisaData.districts.filter((item) => {
      if (onlyEastern && !EASTERN_DISTRICTS.includes(item.district.toUpperCase())) {
        return false;
      }
      if (selectedArea !== "ALL" && item.area !== selectedArea) {
        return false;
      }
      if (selectedRegional !== "ALL" && item.regional !== selectedRegional) {
        return false;
      }
      if (wisaSearch.trim()) {
        const q = wisaSearch.toLowerCase();
        const matchName = item.district.toLowerCase().includes(q);
        const matchReg = item.regional.toLowerCase().includes(q);
        const matchArea = item.area.toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchArea) return false;
      }
      return true;
    });
  }, [wisaData, onlyEastern, selectedArea, selectedRegional, wisaSearch]);

  // Export CSV for WISA Racing
  const handleExportWisaCSV = () => {
    if (!filteredWisaDistricts.length) return;
    const headers = ["Rank", "District", "Area", "Regional", "Achieved", "Not Achieved", "N/A", "Total KPI", "Percent"];
    const rows = [headers.join(",")];
    filteredWisaDistricts.forEach((d) => {
      rows.push(
        [
          d.rank,
          `"${d.district}"`,
          `"${d.area}"`,
          `"${d.regional}"`,
          d.achieved,
          d.notAchieved,
          d.na,
          d.total,
          `${d.percent}%`,
        ].join(",")
      );
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `wisa_district_racing_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV for Eastern Indicators
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
    <div className="space-y-6 animate-fade-in">
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
            Leaderboard KPI Eastern
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Data pemeringkatan 61 District se-Indonesia (WISA Racing) serta perbandingan District Eastern (Bogor, Bekasi, Karawang).
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="inline-flex items-center p-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab("wisa")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "wisa"
                ? "bg-accent-blue text-white shadow-md shadow-accent-blue/20"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard 61 District (WISA)
          </button>
          <button
            onClick={() => setActiveTab("eastern")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "eastern"
                ? "bg-accent-blue text-white shadow-md shadow-accent-blue/20"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Detail Performa Eastern (3 District)
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: LEADERBOARD 61 DISTRICT (WISA RACING)                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "wisa" && (
        <div className="space-y-6">
          {/* Top 3 Podium (from WISA data if available, or Eastern Top 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(wisaData?.districts.slice(0, 3) || []).map((item, idx) => {
              const style = getRankBadge(idx);
              const isEastern = EASTERN_DISTRICTS.includes(item.district.toUpperCase());

              return (
                <div
                  key={`podium-${item.district}`}
                  className={cn(
                    "glass-card p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between",
                    style.border
                  )}
                >
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
                    {isEastern && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/10 text-accent-blue border border-accent-blue/30">
                        EASTERN
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                      {item.district}
                    </h3>
                    <p className="text-[11px] text-foreground-muted mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-accent-blue" />
                      {item.regional} • {item.area}
                    </p>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
                        {item.percent}%
                      </span>
                      <span className="text-xs text-foreground-muted">Pencapaian Racing</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-[var(--surface-hover)] h-2 rounded-full mt-2.5 overflow-hidden border border-[var(--border)]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          item.percent >= 80
                            ? "bg-emerald-500"
                            : item.percent >= 50
                            ? "bg-accent-blue"
                            : "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(100, item.percent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <div className="text-[10px] text-foreground-muted uppercase font-semibold">ACH</div>
                      <div className="text-base font-bold text-emerald-400 tabular-nums">{item.achieved}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/20">
                      <div className="text-[10px] text-foreground-muted uppercase font-semibold">NOT ACH</div>
                      <div className="text-base font-bold text-rose-400 tabular-nums">{item.notAchieved}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-500/5 border border-zinc-500/20">
                      <div className="text-[10px] text-foreground-muted uppercase font-semibold">N/A</div>
                      <div className="text-base font-bold text-foreground-muted tabular-nums">{item.na}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Container */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent-blue" />
                  Daftar Peringkat District Racing (WISA)
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Menampilkan {filteredWisaDistricts.length} dari {wisaData?.totalDistricts || 0} District di seluruh Indonesia.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportWisaCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-semibold text-foreground hover:bg-[var(--surface)] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-accent-blue" />
                  Export CSV ({filteredWisaDistricts.length})
                </button>
                <button
                  onClick={refetchWisa}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-semibold text-foreground hover:bg-[var(--surface)] transition-colors"
                  title="Refresh Data dari Google Sheet"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 text-accent-blue", wisaLoading && "animate-spin")} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari district..."
                  value={wisaSearch}
                  onChange={(e) => setWisaSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-blue transition-colors"
                />
              </div>

              {/* Eastern Only Toggle Button */}
              <button
                onClick={() => setOnlyEastern(!onlyEastern)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5",
                  onlyEastern
                    ? "bg-accent-blue text-white border-accent-blue shadow-sm shadow-accent-blue/20"
                    : "bg-[var(--surface-hover)] text-foreground-muted border-[var(--border)] hover:text-foreground"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {onlyEastern ? "✓ Filter: Khusus Eastern (3)" : "Filter: Khusus Eastern"}
              </button>

              {/* Area Filter */}
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
              >
                <option value="ALL">Semua Area ({wisaData?.areas.length || 0})</option>
                {wisaData?.areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              {/* Regional Filter */}
              <select
                value={selectedRegional}
                onChange={(e) => setSelectedRegional(e.target.value)}
                className="px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
              >
                <option value="ALL">Semua Regional ({wisaData?.regionals.length || 0})</option>
                {wisaData?.regionals.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Leaderboard Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-foreground-muted border-b border-[var(--border)]">
                    <th className="px-4 py-3 font-semibold text-center w-16">RANK</th>
                    <th className="px-4 py-3 font-semibold">DISTRICT</th>
                    <th className="px-4 py-3 font-semibold">REGIONAL & AREA</th>
                    <th className="px-4 py-3 font-semibold text-center text-emerald-400">ACHIEVED</th>
                    <th className="px-4 py-3 font-semibold text-center text-rose-400">NOT ACHIEVED</th>
                    <th className="px-4 py-3 font-semibold text-center text-foreground-muted">N/A</th>
                    <th className="px-4 py-3 font-semibold text-center">TOTAL</th>
                    <th className="px-4 py-3 font-semibold text-right pr-6">PENCAPAIAN</th>
                    <th className="px-4 py-3 font-semibold text-center w-28">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredWisaDistricts.map((item) => {
                    const isEastern = EASTERN_DISTRICTS.includes(item.district.toUpperCase());
                    const isExpanded = expandedDistrict === item.district;

                    return (
                      <tbody key={item.district} className="divide-y divide-[var(--border)]">
                        <tr
                          className={cn(
                            "transition-colors",
                            isEastern ? "bg-accent-blue/5 font-semibold" : "hover:bg-[var(--surface-hover)]"
                          )}
                        >
                          {/* Rank */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {item.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">
                                🥇
                              </span>
                            ) : item.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 font-bold text-xs">
                                🥈
                              </span>
                            ) : item.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 font-bold text-xs">
                                🥉
                              </span>
                            ) : (
                              <span className="font-bold text-foreground-muted tabular-nums">#{item.rank}</span>
                            )}
                          </td>

                          {/* District Name */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{item.district}</span>
                              {isEastern && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
                                  EASTERN
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Regional & Area */}
                          <td className="px-4 py-3 whitespace-nowrap text-foreground-muted text-[11px]">
                            <span className="font-semibold text-foreground">{item.regional}</span> • {item.area}
                          </td>

                          {/* Achieved */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold tabular-nums border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              {item.achieved}
                            </span>
                          </td>

                          {/* Not Achieved */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-bold tabular-nums border border-rose-500/20">
                              <XCircle className="w-3 h-3" />
                              {item.notAchieved}
                            </span>
                          </td>

                          {/* N/A */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-[var(--surface-hover)] text-foreground-muted font-medium tabular-nums border border-[var(--border)]">
                              {item.na}
                            </span>
                          </td>

                          {/* Total */}
                          <td className="px-4 py-3 text-center whitespace-nowrap font-bold text-foreground tabular-nums">
                            {item.total}
                          </td>

                          {/* Percent & Progress Bar */}
                          <td className="px-4 py-3 text-right pr-6 whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-foreground tabular-nums">{item.percent}%</span>
                              <div className="w-20 bg-[var(--surface-hover)] h-1.5 rounded-full mt-1 overflow-hidden border border-[var(--border)]">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    item.percent >= 80
                                      ? "bg-emerald-500"
                                      : item.percent >= 50
                                      ? "bg-accent-blue"
                                      : "bg-amber-500"
                                  )}
                                  style={{ width: `${Math.min(100, item.percent)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Expand Detail Button */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => setExpandedDistrict(isExpanded ? null : item.district)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] font-semibold text-foreground hover:bg-[var(--surface)] transition-colors"
                            >
                              {isExpanded ? "Tutup" : "50 KPI"}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable 50 Indicators Detail */}
                        {isExpanded && (
                          <tr className="bg-[var(--surface-hover)]/70">
                            <td colSpan={9} className="p-4">
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-accent-blue" />
                                    Rincian 50 KPI Racing: {item.district} ({item.regional})
                                  </div>
                                  <span className="text-xs text-foreground-muted">
                                    {item.indicators.length} Indikator Racing
                                  </span>
                                </div>

                                <div className="max-h-80 overflow-y-auto rounded-lg border border-[var(--border)]">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-[var(--surface-hover)] text-foreground-muted sticky top-0">
                                      <tr>
                                        <th className="px-3 py-2 w-10 text-center">NO</th>
                                        <th className="px-3 py-2">INDIKATOR</th>
                                        <th className="px-3 py-2 text-center">TARGET</th>
                                        <th className="px-3 py-2 text-center">REALISASI</th>
                                        <th className="px-3 py-2 text-center">ACH (%)</th>
                                        <th className="px-3 py-2 text-center">STATUS</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                      {item.indicators.map((ind, iIdx) => (
                                        <tr key={`ind-${item.district}-${iIdx}`} className="hover:bg-[var(--surface-hover)]">
                                          <td className="px-3 py-2 text-center text-foreground-muted font-mono">
                                            {ind.no || iIdx + 1}
                                          </td>
                                          <td className="px-3 py-2 font-medium text-foreground">{ind.indikator}</td>
                                          <td className="px-3 py-2 text-center text-foreground-muted tabular-nums">
                                            {ind.target}
                                          </td>
                                          <td className="px-3 py-2 text-center font-bold text-foreground tabular-nums">
                                            {ind.realisasi}
                                          </td>
                                          <td className="px-3 py-2 text-center font-bold text-foreground tabular-nums">
                                            {ind.ach}
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <span
                                              className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                ind.status.toUpperCase() === "ACHIEVED"
                                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                  : ind.status.toUpperCase().includes("NOT")
                                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                                  : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                                              )}
                                            >
                                              {ind.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: DETAIL PERFORMA EASTERN (3 DISTRICT)                           */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "eastern" && (
        <div className="space-y-6">
          {/* Podium Cards (Rank 1, 2, 3) */}
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

          {/* Segment Matrix Comparison */}
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
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="font-bold tabular-nums text-foreground">
                            {row.districts.bogor.percent}
                          </div>
                          <div className="text-[10px] text-foreground-muted tabular-nums">
                            {row.districts.bogor.ach} / {row.districts.bogor.total}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="font-bold tabular-nums text-foreground">
                            {row.districts.bekasi.percent}
                          </div>
                          <div className="text-[10px] text-foreground-muted tabular-nums">
                            {row.districts.bekasi.ach} / {row.districts.bekasi.total}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="font-bold tabular-nums text-foreground">
                            {row.districts.karawang.percent}
                          </div>
                          <div className="text-[10px] text-foreground-muted tabular-nums">
                            {row.districts.karawang.ach} / {row.districts.karawang.total}
                          </div>
                        </td>
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

          {/* Detailed Indicators Table */}
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

              <select
                value={selectedSegmen}
                onChange={(e) => setSelectedSegmen(e.target.value)}
                className="px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
              >
                <option value="ALL">Semua Segmen ({data.indicators.length})</option>
                {Array.from(new Set(data.indicators.map((i) => i.segmen.toUpperCase()))).map((seg) => (
                  <option key={seg} value={seg}>
                    Segmen: {seg}
                  </option>
                ))}
              </select>

              <select
                value={racingFilter}
                onChange={(e) => setRacingFilter(e.target.value as any)}
                className="px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs text-foreground focus:outline-none focus:border-accent-blue transition-colors"
              >
                <option value="ALL">Semua Indikator (Racing & Non-Racing)</option>
                <option value="RACING">Hanya 50 KPI Racing</option>
                <option value="NON_RACING">Hanya Non-Racing</option>
              </select>
            </div>

            {/* 90 Indicators Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-foreground-muted border-b border-[var(--border)]">
                    <th className="px-3 py-3 font-semibold text-center w-12">NO</th>
                    <th className="px-4 py-3 font-semibold min-w-[220px]">INDIKATOR</th>
                    <th className="px-3 py-3 font-semibold text-center">SEGMEN</th>
                    <th className="px-3 py-3 font-semibold text-center">TARGET</th>
                    <th className="px-3 py-3 font-semibold text-center border-l border-[var(--border)]">EASTERN</th>
                    <th className="px-3 py-3 font-semibold text-center text-emerald-400 border-l border-[var(--border)]">BOGOR</th>
                    <th className="px-3 py-3 font-semibold text-center text-blue-400 border-l border-[var(--border)]">BEKASI</th>
                    <th className="px-3 py-3 font-semibold text-center text-purple-400 border-l border-[var(--border)]">KARAWANG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredIndicators.map((ind) => {
                    const segColor = SEGMEN_COLORS[ind.segmen?.toUpperCase()] || {
                      bg: "bg-zinc-500/10",
                      text: "text-zinc-400",
                      border: "border-zinc-500/20",
                    };

                    return (
                      <tr key={`ind-${ind.no}`} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="px-3 py-2.5 text-center text-foreground-muted font-mono">{ind.no}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            {ind.indikator}
                            {ind.kpiRacing && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                RACING
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", segColor.bg, segColor.text, segColor.border)}>
                            {ind.segmen}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-foreground tabular-nums">
                          {ind.target ?? "-"}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-400 border-l border-[var(--border)] tabular-nums">
                          {ind.eastern.real ?? "-"}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-foreground border-l border-[var(--border)] tabular-nums">
                          {ind.bogor.real ?? "-"}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-foreground border-l border-[var(--border)] tabular-nums">
                          {ind.bekasi.real ?? "-"}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-foreground border-l border-[var(--border)] tabular-nums">
                          {ind.karawang.real ?? "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
