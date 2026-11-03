"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { SpecialCategoryData, SpecialCategoryLeaderboardItem } from "@/types/special-category";
import {
  Trophy,
  Medal,
  Award,
  BookOpen,
  Download,
  RefreshCw,
  Search,
  Sparkles,
  CheckCircle2,
  X,
  Smartphone,
  Briefcase,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

interface SpecialCategorySectionProps {
  data: SpecialCategoryData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function SpecialCategorySection({
  data,
  isLoading = false,
  onRefresh,
}: SpecialCategorySectionProps) {
  const [activeCategoryTab, setActiveCategoryTab] = useState<"ALL" | "DATIN" | "PREMIUM">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Eastern highlights
  const easternDatin = useMemo(() => {
    return data.datin?.leaderboard.find((item) =>
      item.regional.toUpperCase().includes("EASTERN")
    );
  }, [data.datin]);

  const easternPremium = useMemo(() => {
    return data.premiumSite?.leaderboard.find((item) =>
      item.regional.toUpperCase().includes("EASTERN")
    );
  }, [data.premiumSite]);

  // Filter helper
  const filterLeaderboard = (list: SpecialCategoryLeaderboardItem[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.regional.toLowerCase().includes(q) ||
        item.displayName.toLowerCase().includes(q) ||
        item.area_tif.toLowerCase().includes(q)
    );
  };

  const filteredDatinList = useMemo(
    () => filterLeaderboard(data.datin?.leaderboard || []),
    [data.datin, searchQuery]
  );

  const filteredPremiumList = useMemo(
    () => filterLeaderboard(data.premiumSite?.leaderboard || []),
    [data.premiumSite, searchQuery]
  );

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      "Category",
      "KPI Name",
      "Rank",
      "Regional",
      "Area TIF",
      "Achievement (%)",
      "Bonus Tier / Score",
      "Total Points",
      "Total Score",
      "Site Premium Compliance (%)",
    ];

    const rows: string[] = [headers.join(",")];

    // Datin rows
    data.datin?.leaderboard.forEach((item) => {
      const breakdown = item.monthlyBreakdown[0];
      rows.push(
        [
          `"ENTERPRISE SUPPORT"`,
          `"${data.datin.kpiName}"`,
          item.rank,
          `"${item.regional}"`,
          `"${item.area_tif}"`,
          breakdown?.achievement ?? "-",
          breakdown?.bonus ?? "-",
          item.totalPoints,
          item.totalScore,
          `"-"`,
        ].join(",")
      );
    });

    // Premium rows
    data.premiumSite?.leaderboard.forEach((item) => {
      const breakdown = item.monthlyBreakdown[0];
      rows.push(
        [
          `"MOBILE SUPPORT"`,
          `"${data.premiumSite.kpiName}"`,
          item.rank,
          `"${item.regional}"`,
          `"${item.area_tif}"`,
          breakdown?.achievement ?? "-",
          breakdown?.bonusDetail?.bonusScore ?? breakdown?.bonus ?? "-",
          item.totalPoints,
          item.totalScore,
          breakdown?.bonusDetail?.sitePremium !== undefined
            ? `"${breakdown.bonusDetail.sitePremium}%"`
            : `"-"`,
        ].join(",")
      );
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `special_category_leaderboard_${data.week}_${data.from.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* Header Container                                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-[var(--border)]">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <Trophy className="w-7 h-7 text-amber-400 shrink-0" />
                Special Category
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                {data.week} • {data.from}
              </span>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed">
              Regional recognition based on achievement percentage (capped at 110%) plus fixed
              bonus tier points.
            </p>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                Enterprise Support (DATIN)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                Mobile Support (Premium Site)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-hover)] text-foreground-muted border border-[var(--border)]">
                12 Regional Indonesia
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start shrink-0">
            {/* Guide Button */}
            <button
              onClick={() => setShowGuideModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-xs font-bold text-teal-400 hover:bg-teal-500/25 transition-all shadow-sm"
              title="Lihat Pedoman & Formula Special Category"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guide
            </button>

            {/* Download CSV */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all"
              title="Download Data Special Category (CSV)"
            >
              <Download className="w-3.5 h-3.5" />
              Download All KPI
            </button>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-semibold text-foreground hover:bg-[var(--surface)] transition-colors"
                title="Refresh Data Special Category"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5 text-accent-blue", isLoading && "animate-spin")}
                />
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* Eastern Jabotabek Spotlight Banner                          */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-blue/15 via-purple-500/10 to-accent-blue/5 border border-accent-blue/30 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-accent-blue">
                  Pencapaian Regional Anda: 06-EASTERN JABOTABEK
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                Hasil evaluasi performa nasional WISA Special Awards minggu ini
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              {/* Enterprise Support Pill */}
              <div className="p-3 rounded-xl bg-[var(--surface)]/80 border border-purple-500/30 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <span className="text-lg">🥈</span>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                    Enterprise Support
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-foreground">
                      Rank #{easternDatin?.rank ?? 2}
                    </span>
                    <span className="text-xs font-bold text-amber-400">
                      {(easternDatin?.totalScore ?? 108.81).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[10px] text-foreground-muted">
                    Ach {(easternDatin?.monthlyBreakdown[0]?.achievement ?? 102.81).toFixed(1)}% • Bonus +{easternDatin?.monthlyBreakdown[0]?.bonus ?? 6}
                  </div>
                </div>
              </div>

              {/* Mobile Support Pill */}
              <div className="p-3 rounded-xl bg-[var(--surface)]/80 border border-cyan-500/30 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <span className="text-lg">📱</span>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    Mobile Support
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-foreground">
                      Rank #{easternPremium?.rank ?? 9}
                    </span>
                    <span className="text-xs font-bold text-cyan-400">
                      {(easternPremium?.totalScore ?? 111.29).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[10px] text-foreground-muted">
                    Ach {(easternPremium?.monthlyBreakdown[0]?.achievement ?? 101.49).toFixed(1)}% • Site 100%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* Filter Controls                                             */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveCategoryTab("ALL")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                activeCategoryTab === "ALL"
                  ? "bg-accent-blue text-white shadow-sm shadow-accent-blue/30"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              Semua Kategori (2)
            </button>
            <button
              onClick={() => setActiveCategoryTab("DATIN")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                activeCategoryTab === "DATIN"
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              <Briefcase className="w-3 h-3" />
              Enterprise Support
            </button>
            <button
              onClick={() => setActiveCategoryTab("PREMIUM")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                activeCategoryTab === "PREMIUM"
                  ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              <Smartphone className="w-3 h-3" />
              Mobile Support
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Cari Regional / Area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Category Cards Grid                                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "grid gap-6",
          activeCategoryTab === "ALL" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        )}
      >
        {/* CATEGORY 1: ENTERPRISE SUPPORT */}
        {(activeCategoryTab === "ALL" || activeCategoryTab === "DATIN") && (
          <CategoryLeaderboardCard
            title="ENTERPRISE SUPPORT"
            kpiName={data.datin?.kpiName || "ASR-ENT-TTR Compliance K2 dan K1 Repair DATIN 3,6 Jam"}
            themeColor="purple"
            items={filteredDatinList}
            week={data.week}
            month={data.from}
          />
        )}

        {/* CATEGORY 2: MOBILE SUPPORT */}
        {(activeCategoryTab === "ALL" || activeCategoryTab === "PREMIUM") && (
          <CategoryLeaderboardCard
            title="MOBILE SUPPORT"
            kpiName={data.premiumSite?.kpiName || "ASR-WHM-MTTRi Premium Site Compliance"}
            themeColor="cyan"
            items={filteredPremiumList}
            isMobileSupport={true}
            week={data.week}
            month={data.from}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Guide Modal                                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5 rounded-3xl border border-[var(--border)] shadow-2xl relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[var(--surface-hover)] text-foreground-muted hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">
                  Pedoman Formula Special Category
                </h3>
                <p className="text-xs text-foreground-muted">
                  WISA Performance Intelligence • Special Awards System
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-foreground-muted leading-relaxed">
              <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  1. Enterprise Support (DATIN)
                </h4>
                <p>
                  <strong>Indikator Evaluasi:</strong> ASR-ENT-TTR Compliance K2 dan K1 Repair
                  DATIN 3,6 Jam.
                </p>
                <p>
                  <strong>Formula Penilaian:</strong> Total Score dihitung dari pencapaian KPI
                  (persentase achievement yang di-cap maksimal 110%) ditambah dengan{" "}
                  <em>Fixed Bonus Tier Points</em> (berkisar antara +4 hingga +10 poin tergantung
                  bracket performa).
                </p>
                <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[11px] font-mono text-foreground border border-[var(--border)]">
                  Total Score = min(Achievement %, 110%) + Tier Bonus Points
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  2. Mobile Support (Premium Site)
                </h4>
                <p>
                  <strong>Indikator Evaluasi:</strong> ASR-WHM-MTTRi Premium Site Compliance.
                </p>
                <p>
                  <strong>Formula Penilaian:</strong> Dihitung berdasarkan persentase achievement
                  MTTRi Premium Site (capped 110%) ditambah dengan persentase kepatuhan Site
                  Premium compliance bonus score.
                </p>
                <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[11px] font-mono text-foreground border border-[var(--border)]">
                  Total Score = min(MTTRi Ach %, 110%) + Bonus Score (Site Premium Compliance)
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Ties & Penentuan Peringkat
                </h4>
                <p>
                  Jika terdapat Total Score yang bernilai sama, penentuan peringkat dilakukan
                  berdasarkan total poin akumulasi dan persentase realisasi achievement murni
                  sebelum capping.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white font-bold text-xs transition-all shadow-md shadow-accent-blue/20"
              >
                Tutup Pedoman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Component: Category Leaderboard Card
// ─────────────────────────────────────────────────────────────────────────────
interface CategoryLeaderboardCardProps {
  title: string;
  kpiName: string;
  themeColor: "purple" | "cyan";
  items: SpecialCategoryLeaderboardItem[];
  isMobileSupport?: boolean;
  week: string;
  month: string;
}

function CategoryLeaderboardCard({
  title,
  kpiName,
  themeColor,
  items,
  isMobileSupport = false,
  week,
  month,
}: CategoryLeaderboardCardProps) {
  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];

  const maxScore = useMemo(() => {
    if (!items.length) return 120;
    return Math.max(...items.map((i) => i.totalScore), 100);
  }, [items]);

  return (
    <div className="glass-card p-5 sm:p-6 space-y-5 flex flex-col justify-between">
      {/* Top Details */}
      <div className="space-y-4">
        {/* Category Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                  themeColor === "purple"
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                    : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                )}
              >
                {title}
              </span>
              <span className="text-xs font-semibold text-foreground-muted">
                {items.length} Peserta
              </span>
            </div>
            <h3 className="text-base font-extrabold text-foreground line-clamp-2" title={kpiName}>
              {kpiName}
            </h3>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* Podium Top 3 Showcase                                       */}
        {/* ─────────────────────────────────────────────────────────── */}
        {top1 && (
          <div className="grid grid-cols-3 gap-2 pt-1 pb-3">
            {/* Rank 2 (Silver) */}
            {top2 && (
              <div
                className={cn(
                  "p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all",
                  top2.regional.includes("EASTERN")
                    ? "bg-accent-blue/15 border-2 border-accent-blue shadow-lg shadow-accent-blue/20"
                    : "bg-[var(--surface-hover)] border border-[var(--border)]"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-slate-300/20 text-slate-300 font-black text-sm flex items-center justify-center border border-slate-300/30 shadow-sm mb-1">
                  🥈
                </div>
                <div className="space-y-0.5">
                  <div
                    className={cn(
                      "text-xs font-black truncate max-w-[95px]",
                      top2.regional.includes("EASTERN") ? "text-accent-blue font-extrabold" : "text-foreground"
                    )}
                    title={top2.displayName}
                  >
                    {top2.displayName.replace(/^\d+-/, "")}
                  </div>
                  <div className="text-[10px] text-foreground-muted font-mono">{top2.area_tif}</div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-[var(--border)] w-full">
                  <div className="text-sm font-black text-foreground">
                    {top2.totalScore.toFixed(1)}
                  </div>
                  <div className="text-[9px] text-foreground-muted">
                    Ach {top2.monthlyBreakdown[0]?.achievement.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold) */}
            <div
              className={cn(
                "p-3.5 rounded-2xl flex flex-col items-center justify-between text-center -translate-y-1 shadow-lg transition-all",
                top1.regional.includes("EASTERN")
                  ? "bg-accent-blue/20 border-2 border-accent-blue shadow-accent-blue/30"
                  : "bg-amber-500/10 border-2 border-amber-500/40 shadow-amber-500/10"
              )}
            >
              <div className="w-9 h-9 rounded-full bg-amber-400/25 text-amber-300 font-black text-base flex items-center justify-center border border-amber-400/40 shadow-md mb-1 animate-pulse">
                🥇
              </div>
              <div className="space-y-0.5">
                <div
                  className="text-xs font-black text-amber-400 truncate max-w-[100px]"
                  title={top1.displayName}
                >
                  {top1.displayName.replace(/^\d+-/, "")}
                </div>
                <div className="text-[10px] text-amber-400/70 font-mono">{top1.area_tif}</div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-amber-500/30 w-full">
                <div className="text-base font-black text-amber-300">
                  {top1.totalScore.toFixed(1)}
                </div>
                <div className="text-[9px] text-amber-400/80">
                  Ach {top1.monthlyBreakdown[0]?.achievement.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            {top3 && (
              <div
                className={cn(
                  "p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all",
                  top3.regional.includes("EASTERN")
                    ? "bg-accent-blue/15 border-2 border-accent-blue shadow-lg shadow-accent-blue/20"
                    : "bg-[var(--surface-hover)] border border-[var(--border)]"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 font-black text-sm flex items-center justify-center border border-amber-700/30 shadow-sm mb-1">
                  🥉
                </div>
                <div className="space-y-0.5">
                  <div
                    className={cn(
                      "text-xs font-black truncate max-w-[95px]",
                      top3.regional.includes("EASTERN") ? "text-accent-blue font-extrabold" : "text-foreground"
                    )}
                    title={top3.displayName}
                  >
                    {top3.displayName.replace(/^\d+-/, "")}
                  </div>
                  <div className="text-[10px] text-foreground-muted font-mono">{top3.area_tif}</div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-[var(--border)] w-full">
                  <div className="text-sm font-black text-foreground">
                    {top3.totalScore.toFixed(1)}
                  </div>
                  <div className="text-[9px] text-foreground-muted">
                    Ach {top3.monthlyBreakdown[0]?.achievement.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* Full Rankings 1..12 Table List                              */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider flex items-center justify-between px-2">
            <span>Ranking Regional</span>
            <span>Total Score</span>
          </div>

          <div className="space-y-1.5">
            {items.map((item) => {
              const isEastern = item.regional.toUpperCase().includes("EASTERN");
              const breakdown = item.monthlyBreakdown[0];
              const scorePercent = Math.min((item.totalScore / maxScore) * 100, 100);

              return (
                <div
                  key={item.regional}
                  className={cn(
                    "p-3 rounded-xl border transition-all relative overflow-hidden flex items-center justify-between gap-3",
                    isEastern
                      ? "bg-accent-blue/15 border-accent-blue shadow-md shadow-accent-blue/10 ring-1 ring-accent-blue"
                      : "bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)]"
                  )}
                >
                  {/* Left: Rank & Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0",
                        item.rank === 1 && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                        item.rank === 2 && "bg-slate-300/20 text-slate-300 border border-slate-300/30",
                        item.rank === 3 && "bg-amber-700/20 text-amber-500 border border-amber-700/30",
                        item.rank > 3 && "bg-[var(--surface-hover)] text-foreground-muted border border-[var(--border)]"
                      )}
                    >
                      {item.rank <= 3 ? (
                        item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : "🥉"
                      ) : (
                        item.rank
                      )}
                    </div>

                    {/* Regional Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-xs font-extrabold truncate",
                            isEastern ? "text-accent-blue" : "text-foreground"
                          )}
                        >
                          {item.displayName}
                        </span>
                        {isEastern && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-accent-blue text-white uppercase tracking-wider">
                            Eastern
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-foreground-muted">
                        <span>{item.area_tif}</span>
                        <span>•</span>
                        <span>Ach: {breakdown?.achievement.toFixed(1)}%</span>
                        {isMobileSupport && breakdown?.bonusDetail?.sitePremium !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">
                              Site: {breakdown.bonusDetail.sitePremium}%
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          Bonus: +{breakdown?.bonusDetail?.bonusScore ?? breakdown?.bonus ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-right shrink-0">
                    <div
                      className={cn(
                        "text-base font-black tracking-tight",
                        isEastern ? "text-accent-blue" : "text-foreground"
                      )}
                      title={`Nilai Presisi: ${item.totalScore}`}
                    >
                      {item.totalScore.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-foreground-muted font-mono">
                      {item.totalPoints} pts
                    </div>
                  </div>

                  {/* Bottom mini progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--border)] overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        isEastern
                          ? "bg-accent-blue"
                          : themeColor === "purple"
                          ? "bg-purple-500/70"
                          : "bg-cyan-500/70"
                      )}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

