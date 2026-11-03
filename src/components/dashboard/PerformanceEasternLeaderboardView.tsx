"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PerformanceEasternData, SegmentSummaryRow } from "@/types/performance-eastern";
import { useLeaderboardWisa } from "@/hooks/useLeaderboardWisa";
import { useSpecialCategory } from "@/hooks/useSpecialCategory";
import { SpecialCategorySection } from "@/components/dashboard/SpecialCategorySection";
import { useAreaAchievement } from "@/hooks/useAreaAchievement";
import { AreaAchievementSection } from "@/components/dashboard/AreaAchievementSection";
import type { DistrictRacingItem } from "@/types/leaderboard-wisa";
import {
  Trophy,
  Flame,
  Layers,
  Search,
  Download,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  RefreshCw,
  Info,
  BookOpen,
  SlidersHorizontal,
  X,
  RotateCcw,
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
  const { data: wisaData, isLoading: wisaLoading, refetch: refetchWisa } = useLeaderboardWisa();

  // Special Category Hook
  const { data: specialData, isLoading: specialLoading, refetch: refetchSpecial } = useSpecialCategory();

  // Area Achievement Hook
  const { data: areaData, isLoading: areaLoading, refetch: refetchArea } = useAreaAchievement();
  const [regionalViewSubTab, setRegionalViewSubTab] = useState<"areaAchievement" | "specialAwards">("areaAchievement");

  // Tab switcher: "wisa" (61 District) vs "special" (Regional Awards) vs "eastern" (3 District Eastern)
  const [activeTab, setActiveTab] = useState<"wisa" | "special" | "eastern">("wisa");

  // Filter state for WISA tab
  const [rankingViewMode, setRankingViewMode] = useState<"top10" | "all">("top10");
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
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

  // Filtered WISA Districts (Base filtered list before slicing)
  const baseFilteredWisaDistricts = useMemo(() => {
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

  // Displayed WISA Districts (respects Top 10 vs All toggle)
  const displayedWisaDistricts = useMemo(() => {
    if (rankingViewMode === "top10") {
      return baseFilteredWisaDistricts.slice(0, 10);
    }
    return baseFilteredWisaDistricts;
  }, [baseFilteredWisaDistricts, rankingViewMode]);

  // Export CSV for WISA Racing
  const handleExportWisaCSV = () => {
    const listToExport = baseFilteredWisaDistricts.length > 0 ? baseFilteredWisaDistricts : (wisaData?.districts || []);
    if (!listToExport.length) return;
    const headers = [
      "Rank",
      "District",
      "Area",
      "Regional",
      "Achieved",
      "Not Achieved",
      "N/A",
      "Total KPI",
      "Ach Rate",
      "Average",
    ];
    const rows = [headers.join(",")];
    listToExport.forEach((d) => {
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
          `"${d.achRate}"`,
          `"${d.average}"`,
        ].join(",")
      );
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `district_racing_wisa_${Date.now()}.csv`);
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
            Data pemeringkatan 61 District se-Indonesia (WISA Racing) serta perbandingan performa District Eastern.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="inline-flex items-center p-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl shrink-0 self-start md:self-center overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("wisa")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "wisa"
                ? "bg-accent-blue text-white shadow-md shadow-accent-blue/20"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            <Trophy className="w-3.5 h-3.5" />
            District Racing (61 District)
          </button>
          <button
            onClick={() => setActiveTab("special")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "special"
                ? "bg-accent-blue text-white shadow-md shadow-accent-blue/20"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            Area & Regional Achievement
          </button>
          <button
            onClick={() => setActiveTab("eastern")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
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
      {/* TAB 1: LEADERBOARD 61 DISTRICT (WISA RACING - IDENTICAL TO WISA)      */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "wisa" && (
        <div className="space-y-6">
          {/* Main Card Container */}
          <div className="glass-card p-6 space-y-5">
            {/* WISA Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-[var(--border)]">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">
                    District Racing — {rankingViewMode === "top10" ? "Top 10" : `Full Ranking (${baseFilteredWisaDistricts.length})`}
                  </h2>
                </div>

                {/* Period Subtitle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground-muted tracking-wide">
                    Week 4 • OCT 2026
                  </span>
                </div>

                {/* Formula Description (Exact from WISA) */}
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Ranked by achieved KPIs; ties broken by average achievement across achieved KPIs only (each capped at 110%). NO TICKET on an assurance KPI scores 110% for that KPI.
                </p>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Racing KPI Only
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-hover)] text-foreground-muted border border-[var(--border)]">
                    Evaluasi 65 KPI
                  </span>
                  {onlyEastern && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-blue/15 text-accent-blue border border-accent-blue/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Filter: Khusus Eastern Jabotabek
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Matching WISA Controls */}
              <div className="flex items-center gap-2 flex-wrap self-start shrink-0">
                {/* Guide Button */}
                <button
                  onClick={() => setShowGuideModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-xs font-bold text-teal-400 hover:bg-teal-500/25 transition-all shadow-sm"
                  title="Lihat Aturan & Formula Perhitungan WISA"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Guide
                </button>

                {/* Racing KPI Badge */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Racing KPI
                </div>

                {/* Download All KPI Button */}
                <button
                  onClick={handleExportWisaCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all"
                  title="Download CSV Ranking KPI"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download All KPI
                </button>

                {/* View Full Ranking (61) / Top 10 Toggle */}
                <button
                  onClick={() => setRankingViewMode(rankingViewMode === "top10" ? "all" : "top10")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-bold text-foreground hover:bg-[var(--surface)] transition-all shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-accent-blue" />
                  {rankingViewMode === "top10"
                    ? `View full ranking (${wisaData?.totalDistricts || 61})`
                    : "Top 10"}
                </button>

                {/* Refresh Data */}
                <button
                  onClick={refetchWisa}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-semibold text-foreground hover:bg-[var(--surface)] transition-colors"
                  title="Refresh Data dari Google Sheet"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 text-accent-blue", wisaLoading && "animate-spin")} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filter Bar with Quick Pills and Dropdowns */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
              {/* Quick Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl shrink-0 overflow-x-auto">
                <button
                  onClick={() => {
                    setRankingViewMode("top10");
                    setOnlyEastern(false);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    rankingViewMode === "top10" && !onlyEastern
                      ? "bg-accent-blue text-white shadow-sm shadow-accent-blue/30"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  Top 10
                </button>
                <button
                  onClick={() => {
                    setRankingViewMode("all");
                    setOnlyEastern(false);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    rankingViewMode === "all" && !onlyEastern
                      ? "bg-accent-blue text-white shadow-sm shadow-accent-blue/30"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  Semua ({wisaData?.totalDistricts || 61})
                </button>
                <button
                  onClick={() => {
                    const nextVal = !onlyEastern;
                    setOnlyEastern(nextVal);
                    if (nextVal) setRankingViewMode("all");
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                    onlyEastern
                      ? "bg-accent-blue text-white shadow-sm shadow-accent-blue/30"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Khusus Eastern (3)
                </button>
              </div>

              {/* Search, Area, and Regional Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 lg:max-w-xl">
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
                  {wisaSearch && (
                    <button
                      onClick={() => setWisaSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

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
            </div>

            {/* List Rows Matching WISA Layout */}
            <div className="space-y-3 pt-2">
              {displayedWisaDistricts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)]/30 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Tidak ada district yang sesuai dengan filter.</p>
                  <button
                    onClick={() => {
                      setWisaSearch("");
                      setSelectedArea("ALL");
                      setSelectedRegional("ALL");
                      setOnlyEastern(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-blue text-white text-xs font-bold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Semua Filter
                  </button>
                </div>
              ) : (
                displayedWisaDistricts.map((item) => {
                  const isEastern = EASTERN_DISTRICTS.includes(item.district.toUpperCase());
                  const isExpanded = expandedDistrict === item.district;

                  return (
                    <div
                      key={item.district}
                      className={cn(
                        "rounded-2xl border transition-all duration-200 overflow-hidden",
                        isEastern
                          ? "bg-accent-blue/5 border-accent-blue/30 shadow-sm shadow-accent-blue/5"
                          : "bg-[var(--surface-hover)]/40 border-[var(--border)] hover:border-foreground/20"
                      )}
                    >
                      {/* Main Row */}
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Rank & District Name & Regional */}
                        <div className="flex items-center gap-3.5 min-w-[240px]">
                          {/* Circular Rank Badge */}
                          <div className="shrink-0 flex items-center justify-center">
                            {item.rank === 1 ? (
                              <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shadow-md shadow-amber-400/30">
                                1
                              </div>
                            ) : item.rank === 2 ? (
                              <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black text-sm flex items-center justify-center shadow-md shadow-slate-300/30">
                                2
                              </div>
                            ) : item.rank === 3 ? (
                              <div className="w-8 h-8 rounded-full bg-amber-600 text-amber-50 font-black text-sm flex items-center justify-center shadow-md shadow-amber-600/30">
                                3
                              </div>
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center text-foreground-muted font-bold text-sm">
                                {item.rank}
                              </div>
                            )}
                          </div>

                          {/* District Name and Tag */}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-foreground text-sm tracking-wide">
                                {item.district}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                {item.regional}
                              </span>
                              {isEastern && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-accent-blue text-white shadow-sm shadow-accent-blue/30">
                                  EASTERN
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-foreground-muted mt-0.5">
                              {item.area}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Achieved / Not Achieved / N/A (Exactly as in WISA) */}
                        <div className="flex items-center gap-6 shrink-0 text-center">
                          <div>
                            <div className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">
                              ACHIEVED
                            </div>
                            <div className="text-base font-black text-emerald-500 tabular-nums">
                              {item.achieved}
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">
                              NOT ACHIEVED
                            </div>
                            <div className="text-base font-black text-rose-500 tabular-nums">
                              {item.notAchieved}
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">
                              N/A
                            </div>
                            <div className="text-base font-bold text-foreground-muted tabular-nums">
                              {item.na}
                            </div>
                          </div>
                        </div>

                        {/* Middle-Right: Progress Bar */}
                        <div className="hidden lg:block w-36 xl:w-48 shrink-0">
                          <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
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

                        {/* Right: Ach Rate, Average, and Detail button */}
                        <div className="flex items-center gap-5 justify-between md:justify-end shrink-0">
                          <div className="text-right">
                            <div className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">
                              ACH RATE
                            </div>
                            <div className="text-xs font-bold text-foreground tabular-nums">
                              {item.achRate}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">
                              AVERAGE
                            </div>
                            <div className="text-xs font-black text-foreground tabular-nums">
                              {item.average}
                            </div>
                          </div>

                          {/* Expand Button with Dynamic KPI Count */}
                          <button
                            onClick={() => setExpandedDistrict(isExpanded ? null : item.district)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-foreground hover:bg-[var(--surface-hover)] transition-colors ml-2"
                          >
                            {isExpanded ? "Tutup" : `${item.total || 65} KPI`}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable KPI Indicators Detail */}
                      {isExpanded && (
                        <div className="border-t border-[var(--border)] p-4 bg-[var(--surface)] space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                            <div className="font-bold text-sm text-foreground flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-accent-blue" />
                              Rincian {item.indicators.length} KPI Racing: {item.district} ({item.regional})
                            </div>
                            <span className="text-xs text-foreground-muted">
                              Total {item.indicators.length} Indikator Racing (Achieved: {item.achieved}, Not Achieved: {item.notAchieved}, N/A: {item.na})
                            </span>
                          </div>

                          <div className="max-h-80 overflow-y-auto rounded-xl border border-[var(--border)]">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[var(--surface-hover)] text-foreground-muted sticky top-0 z-10 border-b border-[var(--border)]">
                                <tr>
                                  <th className="px-3 py-2 w-10 text-center font-bold">NO</th>
                                  <th className="px-3 py-2 font-bold">INDIKATOR</th>
                                  <th className="px-3 py-2 text-center font-bold">TARGET</th>
                                  <th className="px-3 py-2 text-center font-bold">REALISASI</th>
                                  <th className="px-3 py-2 text-center font-bold">ACH (%)</th>
                                  <th className="px-3 py-2 text-center font-bold">STATUS</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border)]">
                                {item.indicators.map((ind, iIdx) => (
                                  <tr key={`ind-${item.district}-${iIdx}`} className="hover:bg-[var(--surface-hover)] transition-colors">
                                    <td className="px-3 py-2 text-center text-foreground-muted font-mono">
                                      {ind.no || iIdx + 1}
                                    </td>
                                    <td className="px-3 py-2 font-semibold text-foreground">{ind.indikator}</td>
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
                                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
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
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom View More / Back to Top 10 Banners */}
            {rankingViewMode === "top10" && baseFilteredWisaDistricts.length > 10 && (
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-foreground-muted">
                  Menampilkan <strong className="text-foreground">Top 10</strong> dari total <strong className="text-foreground">{baseFilteredWisaDistricts.length} District</strong>.
                </div>
                <button
                  onClick={() => setRankingViewMode("all")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue text-white text-xs font-bold hover:bg-accent-blue/90 shadow-sm transition-all"
                >
                  Lihat Seluruh Ranking ({baseFilteredWisaDistricts.length} District)
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}

            {rankingViewMode === "all" && baseFilteredWisaDistricts.length > 10 && (
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-foreground-muted">
                  Menampilkan seluruh <strong className="text-foreground">{baseFilteredWisaDistricts.length} District</strong>.
                </div>
                <button
                  onClick={() => {
                    setRankingViewMode("top10");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-foreground hover:bg-[var(--surface-hover)] transition-all"
                >
                  Kembali ke Top 10
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guide Modal Popup */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 space-y-4 rounded-3xl border border-[var(--border)] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">District Racing Guide</h3>
                  <p className="text-xs text-foreground-muted">Aturan dan Formula Pemeringkatan WISA</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--surface-hover)] text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-foreground">
              <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="font-bold text-teal-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  1. Pemeringkatan Utama (Achieved KPIs)
                </div>
                <p className="text-foreground-muted pl-3.5">
                  District diurutkan terutama berdasarkan total jumlah indikator KPI yang berstatus <strong className="text-emerald-400">ACHIEVED</strong> (capaian target terpenuhi).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  2. Pemecah Nilai Seri (Tie Breaker)
                </div>
                <p className="text-foreground-muted pl-3.5">
                  Jika dua atau lebih district memiliki jumlah Achieved yang sama, posisi ditentukan oleh nilai <strong className="text-foreground">Average Achievement</strong> yang dihitung hanya dari KPI yang Achieved (masing-masing dicap maksimal 110%).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="font-bold text-accent-blue flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-blue" />
                  3. Ketentuan NO TICKET
                </div>
                <p className="text-foreground-muted pl-3.5">
                  Kondisi <strong className="text-foreground">NO TICKET</strong> pada indikator assurance otomatis dihitung skor <strong className="text-foreground">110%</strong> untuk KPI tersebut.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  4. Periode Data & Total KPI
                </div>
                <p className="text-foreground-muted pl-3.5">
                  Data terkini bersumber dari <strong className="text-foreground">Week 4 • OCT 2026</strong> mencakup total 65 indikator Racing KPI di 61 District seluruh Indonesia.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-accent-blue text-white text-xs font-bold hover:bg-accent-blue/90 transition-colors shadow-md"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: AREA & REGIONAL ACHIEVEMENT                                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "special" && (
        <div className="space-y-4">
          {/* Sub-view switcher between Area Achievement (Primary) & Special Awards */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setRegionalViewSubTab("areaAchievement")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                  regionalViewSubTab === "areaAchievement"
                    ? "bg-accent-blue text-white shadow-sm shadow-accent-blue/20"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Area Achievement (Regional Comparison)
              </button>
              <button
                onClick={() => setRegionalViewSubTab("specialAwards")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                  regionalViewSubTab === "specialAwards"
                    ? "bg-accent-blue text-white shadow-sm shadow-accent-blue/20"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                <Trophy className="w-3.5 h-3.5" />
                Special Awards (Datin & Mobile)
              </button>
            </div>
            <span className="text-[11px] font-semibold text-foreground-muted pr-3 hidden md:inline">
              {regionalViewSubTab === "areaAchievement"
                ? "Snapshot Area Achievement WISA"
                : "Snapshot Special Awards WISA"}
            </span>
          </div>

          {regionalViewSubTab === "areaAchievement" ? (
            <AreaAchievementSection
              data={areaData}
              isLoading={areaLoading}
              onRefresh={refetchArea}
            />
          ) : (
            <SpecialCategorySection
              data={specialData}
              isLoading={specialLoading}
              onRefresh={refetchSpecial}
            />
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: DETAIL PERFORMA EASTERN (3 DISTRICT)                           */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "eastern" && (
        <div className="space-y-6">
          {/* Podium Cards (Rank 1, 2, 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {districtRankings.map((item, idx) => {
              const style =
                idx === 0
                  ? {
                      badge: "🥇 RANK 1",
                      border: "border-amber-400/40 bg-gradient-to-b from-amber-500/10 via-[var(--surface)] to-transparent",
                      iconColor: "text-amber-400",
                      ringColor: "ring-amber-400/30",
                    }
                  : idx === 1
                  ? {
                      badge: "🥈 RANK 2",
                      border: "border-slate-300/40 bg-gradient-to-b from-slate-400/10 via-[var(--surface)] to-transparent",
                      iconColor: "text-slate-300",
                      ringColor: "ring-slate-400/30",
                    }
                  : {
                      badge: "🥉 RANK 3",
                      border: "border-amber-700/40 bg-gradient-to-b from-amber-700/10 via-[var(--surface)] to-transparent",
                      iconColor: "text-amber-600",
                      ringColor: "ring-amber-700/30",
                    };

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
                      65 KPI RACING
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
                <option value="RACING">Hanya KPI Racing</option>
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
