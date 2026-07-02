"use client";

import { useState, useMemo, useRef } from "react";
import { Search, Download } from "lucide-react";
import { AchievementBadge } from "@/components/ui/Badge";
import type { SaldoPspiTicket } from "@/types/dashboard";

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
  const tableRef = useRef<HTMLDivElement>(null);

  const handleDownloadPNG = async () => {
    if (!tableRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(tableRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff'
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
    for (const sa of allSAs) {
      if (sa && sa !== "BRANCH BOGOR") {
        ticketCounts.set(sa, 0);
      }
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
        score = (1 - (count / maxTickets)) * 100;
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

    const rankedResult = result.map((item, index) => {
      if (prevScore === null) {
        prevScore = item.score;
        prevCount = item.count;
      } else if (item.score < prevScore || item.count > prevCount!) {
        currentRank = index + 1;
        prevScore = item.score;
        prevCount = item.count;
      }
      
      return { ...item, rank: currentRank };
    });

    // 6. Filter by search
    if (search) {
      const q = search.toLowerCase();
      return rankedResult.filter(r => r.sa.toLowerCase().includes(q));
    }

    return rankedResult;
  }, [tickets, allSAs, search]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">SALDO PS/PI RANKING</h2>
          <p className="text-sm text-foreground-muted">
            Ranking based on highest tickets. 0 tickets = 100% (Rank 1).
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              className="form-input pl-10 w-full text-sm"
              placeholder="Search SA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleDownloadPNG}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-foreground text-sm font-medium rounded-lg border border-[var(--border)] transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
      </div>
      
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
                  className="hover:bg-[var(--surface-hover)] transition-colors group"
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
    </div>
  );
}
