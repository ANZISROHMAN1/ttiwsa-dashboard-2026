"use client";

import { useState, useMemo, useRef } from "react";
import { Search, Download, Filter, ListFilter } from "lucide-react";
import { AchievementBadge, Badge } from "@/components/ui/Badge";
import { PS_PI_SERVICE_AREAS } from "@/lib/constants";
import type { SaldoPspiTicket } from "@/types/dashboard";
import Link from "next/link";

interface SaldoPspiViewProps {
  tickets: SaldoPspiTicket[];
  allSAs: string[];
}

/** Rank number with medal styling */
function RankCell({ rank }: { rank: number }) {
  const medals = ["🥇", "🥈", "🥉"];
  if (rank <= 3) {
    return (
      <span className="text-base" title={`Rank #${rank}`}>
        {medals[rank - 1]}
      </span>
    );
  }
  return (
    <span className="text-foreground-muted font-mono text-xs">#{rank}</span>
  );
}

export function SaldoPspiView({ tickets, allSAs }: SaldoPspiViewProps) {
  const [search, setSearch] = useState("");
  const [saFilter, setSaFilter] = useState<string>("ALL");
  const [showDetailTickets, setShowDetailTickets] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Combine default 10 PS/PI Service Areas with any dynamic ones from data
  const availableSAs = useMemo(() => {
    const set = new Set<string>(PS_PI_SERVICE_AREAS);
    allSAs.forEach((sa) => {
      if (sa && sa !== "BRANCH BOGOR" && sa !== "BOGOR (Include Banten)") {
        set.add(sa);
      }
    });
    tickets.forEach((t) => {
      if (t.SA && t.SA !== "BRANCH BOGOR") {
        set.add(t.SA);
      }
    });
    return Array.from(set).sort();
  }, [allSAs, tickets]);

  const handleDownloadPNG = async () => {
    if (!tableRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(tableRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains("dark") ? "#1e293b" : "#ffffff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `saldo-pspi-ranking-${dateStr}.png`;
      link.click();
    } catch (err: any) {
      console.error("Failed to download image", err);
      alert(`Gagal mengunduh gambar: ${err.message || "Unknown error"}`);
    }
  };

  const rankingData = useMemo(() => {
    // 1. Group tickets by SA and count them
    const ticketCounts = new Map<string, number>();

    // Initialize all SAs to 0
    for (const sa of availableSAs) {
      ticketCounts.set(sa, 0);
    }

    // Count actual tickets
    for (const t of tickets) {
      if (t.SA) {
        ticketCounts.set(t.SA, (ticketCounts.get(t.SA) || 0) + 1);
      }
    }

    // 2. Find max tickets in a single area
    let maxTickets = 0;
    for (const count of ticketCounts.values()) {
      if (count > maxTickets) {
        maxTickets = count;
      }
    }

    // 3. Calculate score and build array
    const result = Array.from(ticketCounts.entries()).map(([sa, count]) => {
      let score = 100;
      if (maxTickets > 0 && count > 0) {
        score = (1 - count / maxTickets) * 100;
      }
      return { sa, count, score };
    });

    // 4. Sort by score DESC, then ticket count ASC
    result.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.count - b.count;
    });

    // 5. Assign ranks (handling ties)
    let currentRank = 1;
    let prevScore: number | null = null;
    let prevCount: number | null = null;

    const rankedResult = result.map((item) => {
      if (prevScore === null) {
        prevScore = item.score;
        prevCount = item.count;
      } else if (item.score < prevScore || item.count > prevCount!) {
        currentRank++;
        prevScore = item.score;
        prevCount = item.count;
      }

      return { ...item, rank: currentRank };
    });

    // 6. Filter by SA Filter & search
    let filtered = rankedResult;
    if (saFilter !== "ALL") {
      filtered = filtered.filter((r) => r.sa === saFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) => r.sa.toLowerCase().includes(q));
    }

    return filtered;
  }, [tickets, availableSAs, saFilter, search]);

  const filteredTickets = useMemo(() => {
    let base = tickets;
    if (saFilter !== "ALL") {
      base = base.filter((t) => t.SA === saFilter);
    }
    if (search) {
      const q = search.toUpperCase();
      base = base.filter(
        (t) =>
          t.SA?.toUpperCase().includes(q) ||
          t.sto?.toUpperCase().includes(q) ||
          t.sc_orderid?.toUpperCase().includes(q) ||
          t.nd?.toUpperCase().includes(q) ||
          t.KETERANGAN?.toUpperCase().includes(q) ||
          t["ERROR CODE"]?.toUpperCase().includes(q) ||
          t["Status PS/PI"]?.toUpperCase().includes(q)
      );
    }
    return base;
  }, [tickets, saFilter, search]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">SALDO PS/PI RANKING & DATA</h2>
          <p className="text-sm text-foreground-muted">
            Ranking based on highest tickets. 0 tickets = 100% (Rank 1).
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto items-stretch sm:items-center">
          {/* SA Filter Dropdown */}
          <div className="relative flex items-center bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 shadow-sm">
            <Filter className="w-4 h-4 text-rose-500 mr-2 shrink-0" />
            <span className="text-xs font-semibold text-foreground-muted mr-2 whitespace-nowrap">SA Filter:</span>
            <select
              value={saFilter}
              onChange={(e) => setSaFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer border-none p-0 pr-4"
            >
              <option value="ALL">ALL SERVICE AREA (BRANCH BOGOR)</option>
              {availableSAs.map((sa) => (
                <option key={sa} value={sa}>
                  {sa}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              className="form-input pl-10 w-full text-sm"
              placeholder="Search SA / Order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowDetailTickets(!showDetailTickets)}
            className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              showDetailTickets
                ? "bg-rose-500 text-white border-rose-600"
                : "bg-[var(--surface-hover)] hover:bg-[var(--border)] text-foreground border-[var(--border)]"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            {showDetailTickets ? "Hide Detail Tickets" : "Show Detail Tickets"}
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-foreground text-sm font-medium rounded-lg border border-[var(--border)] transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="glass-card overflow-hidden" ref={tableRef}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--surface-hover)]">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold text-foreground tracking-wider border-b border-[var(--border)] w-16">
                  RANK
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-foreground tracking-wider border-b border-[var(--border)]">
                  SERVICE AREA
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-foreground tracking-wider border-b border-[var(--border)] w-32">
                  ACHIEVEMENT
                </th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-foreground tracking-wider border-b border-[var(--border)] w-32">
                  TOTAL TICKETS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rankingData.map((item) => (
                <tr
                  key={item.sa}
                  className={`hover:bg-[var(--surface-hover)] transition-colors group ${
                    saFilter === item.sa ? "bg-rose-500/10 font-bold" : ""
                  }`}
                >
                  <td className="px-5 py-3 whitespace-nowrap text-center">
                    <RankCell rank={item.rank} />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-medium text-foreground">
                    {item.sa}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <AchievementBadge value={item.score} />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right font-mono">
                    {item.count}
                  </td>
                </tr>
              ))}
              {rankingData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-foreground-muted">
                    Tidak ada area yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed PS/PI Tickets Section */}
      {showDetailTickets && (
        <div className="glass-card overflow-hidden animate-fade-in mt-6">
          <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-hover)] flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span>Detail Ticket PS/PI</span>
              {saFilter !== "ALL" && (
                <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                  {saFilter}
                </span>
              )}
            </h3>
            <Badge variant="info">Total: {filteredTickets.length} Tickets</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-foreground-muted">
                  <th className="px-5 py-3 font-medium whitespace-nowrap">SA</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">STO</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">SC ORDER ID</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">ND</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">STATUS PS/PI</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">LAST STATUS</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">KETERANGAN</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">ERROR CODE</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filteredTickets.map((t, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap font-medium">{t.SA}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{t.sto}</td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t.sc_orderid}</td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t.nd}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Badge variant="info">{t["Status PS/PI"] || t.f_pspi || "UNKNOWN"}</Badge>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">{t.last_status}</td>
                    <td className="px-5 py-3 min-w-[200px] text-foreground-muted">{t.KETERANGAN}</td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t["ERROR CODE"]}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Link
                        href={`/submit/ps-pi?sc=${encodeURIComponent(t.sc_orderid)}`}
                        className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 transition-colors"
                      >
                        UPDATE DATA
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-foreground-muted">
                      Tidak ada ticket PS/PI yang sesuai dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
