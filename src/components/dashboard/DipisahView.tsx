"use client";

import { useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Badge } from "@/components/ui/Badge";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatPercent } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { generateTelegramText } from "@/lib/telegram";
import type { DashboardSummary, RankingSA, KPISimulation, Ticket, SaldoPspiTicket, UnspecTicket } from "@/types/dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

type DipisahSegment = "indihome" | "indibiz";

interface DipisahViewProps {
  summary: DashboardSummary;
  rankingSA: RankingSA[];
  branchBogor: KPISimulation[];
  branchBogorIncludeBanten: KPISimulation[];
  ttiTickets: Ticket[];
  ffgTickets: Ticket[];
  saldoPspiTickets?: SaldoPspiTicket[];
  unspecTickets?: UnspecTicket[];
  segment: DipisahSegment;
}

const SEGMENT_CONFIG = {
  indihome: {
    label: "Indihome",
    tti: { key: "ttiIH" as keyof RankingSA, title: "TTI 3x24 Indihome" },
    ffg: { key: "ffgIH" as keyof RankingSA, title: "TTR FFG Indihome" },
    garansi: { key: "garansiIH" as keyof RankingSA, title: "FFG Indihome (Garansi)" },
  },
  indibiz: {
    label: "Indibiz",
    tti: { key: "ttiIB" as keyof RankingSA, title: "TTI 1x24 Indibiz" },
    ffg: { key: "ffgIB" as keyof RankingSA, title: "TTR FFG Indibiz" },
    garansi: { key: "garansiIB" as keyof RankingSA, title: "FFG Indibiz (Garansi)" },
  },
} as const;

export function DipisahView({
  summary,
  rankingSA,
  branchBogor,
  branchBogorIncludeBanten,
  ttiTickets,
  ffgTickets,
  saldoPspiTickets = [],
  unspecTickets = [],
  segment,
}: DipisahViewProps) {
  const { isLoggedIn } = useAuth();
  const tablesRef = useRef<HTMLDivElement>(null);
  
  const [selectedTables, setSelectedTables] = useState<string[]>([
    "overall", "tti", "ffg", "garansi", "pspi", "unspec"
  ]);
  const [ttiIbOrderTypeFilter, setTtiIbOrderTypeFilter] = useState<string[]>([]);
  const [isOrderTypeDropdownOpen, setIsOrderTypeDropdownOpen] = useState(false);
  const [ttiIbStatusFilter, setTtiIbStatusFilter] = useState<"ALL" | "COMP" | "NOTC">("ALL");
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  const handleSendTelegram = async () => {
    try {
      setIsSendingTelegram(true);
      
      const dataForTelegram = {
        summary,
        rankingSA,
        saldoPspiTickets: saldoPspiTickets || [],
        unspecTickets: unspecTickets || [],
      } as any;
      
      const text = generateTelegramText(dataForTelegram, true);
      
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Failed to send");
      alert("Report sent to Telegram!");
    } catch (err) {
      console.error(err);
      alert("Error sending report to Telegram");
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const toggleTable = (table: string) => {
    setSelectedTables(prev => 
      prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
    );
  };

  const allSAs = useMemo(() => rankingSA.map(r => r.sa), [rankingSA]);

  const pspiRankingData = useMemo(() => {
    const ticketCounts = new Map<string, number>();
    for (const sa of allSAs) {
      if (sa && sa !== "BRANCH BOGOR") ticketCounts.set(sa, 0);
    }
    for (const t of saldoPspiTickets) {
      if (t.SA) ticketCounts.set(t.SA, (ticketCounts.get(t.SA) || 0) + 1);
    }
    let maxTickets = 0;
    for (const count of ticketCounts.values()) {
      if (count > maxTickets) maxTickets = count;
    }
    const result = Array.from(ticketCounts.entries()).map(([sa, count]) => {
      let score = 100;
      if (maxTickets > 0 && count > 0) score = (1 - (count / maxTickets)) * 100;
      return { sa, count, score };
    });
    result.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.count - b.count;
    });
    return result;
  }, [saldoPspiTickets, allSAs]);

  const unspecRankingData = useMemo(() => {
    const ticketCounts = new Map<string, number>();
    for (const sa of allSAs) {
      if (sa && sa !== "BRANCH BOGOR") ticketCounts.set(sa, 0);
    }
    for (const t of unspecTickets) {
      if (t.SA) ticketCounts.set(t.SA, (ticketCounts.get(t.SA) || 0) + 1);
    }
    let maxTickets = 0;
    for (const count of ticketCounts.values()) {
      if (count > maxTickets) maxTickets = count;
    }
    const result = Array.from(ticketCounts.entries()).map(([sa, count]) => {
      let score = 100;
      if (maxTickets > 0 && count > 0) score = (1 - (count / maxTickets)) * 100;
      return { sa, count, score };
    });
    result.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.count - b.count;
    });
    return result;
  }, [unspecTickets, allSAs]);

  const ttiIbOrderTypes = useMemo(() => {
    const typeCounts = new Map<string, number>();
    let allCount = 0;
    ttiTickets.forEach(t => {
      if (t.kpi === "TTI IB") {
        allCount++;
        if (t.ORDER_TYPE) {
          const type = t.ORDER_TYPE.trim();
          typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        }
      }
    });
    return {
      allCount,
      types: Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => a.type.localeCompare(b.type))
    };
  }, [ttiTickets]);

  const filteredRankingSA = useMemo(() => {
    if (segment !== "indibiz") return rankingSA;

    const filteredTickets = ttiTickets.filter(t => 
      t.kpi === "TTI IB" && 
      (ttiIbOrderTypeFilter.length === 0 || ttiIbOrderTypeFilter.includes((t.ORDER_TYPE || "").trim()))
    );

    if (ttiIbOrderTypeFilter.length === 0 && ttiIbStatusFilter === "ALL") return rankingSA;

    return rankingSA.map(r => {
      const saTickets = filteredTickets.filter(t => t.SA === r.sa);
      const comply = saTickets.filter(t => t.STATUS.includes('COMP')).length;
      const notc = saTickets.length - comply;
      
      let val = 100;
      if (ttiIbStatusFilter === "COMP") {
        val = comply;
      } else if (ttiIbStatusFilter === "NOTC") {
        val = notc;
      } else {
        val = saTickets.length > 0 ? (comply / saTickets.length) * 100 : 100;
      }
      
      return { ...r, ttiIB: val };
    });
  }, [rankingSA, ttiTickets, segment, ttiIbOrderTypeFilter, ttiIbStatusFilter]);

  const ttiIbFilteredTicketsCount = useMemo(() => {
    if (segment !== "indibiz") return 0;
    let filtered = ttiTickets.filter(t => t.kpi === "TTI IB");
    
    if (ttiIbOrderTypeFilter.length > 0) {
      filtered = filtered.filter(t => ttiIbOrderTypeFilter.includes((t.ORDER_TYPE || "").trim()));
    }
    
    if (ttiIbStatusFilter !== "ALL") {
      filtered = filtered.filter(t => t.STATUS.includes(ttiIbStatusFilter));
    }
    
    return filtered.length;
  }, [ttiTickets, segment, ttiIbOrderTypeFilter, ttiIbStatusFilter]);

  const config = SEGMENT_CONFIG[segment];

  const handleDownloadPNG = async () => {
    if (!tablesRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(tablesRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff'
      });
      
      const link = document.createElement("a");
      link.href = dataUrl;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `kpi-tables-${segment}-${dateStr}.png`;
      link.click();
    } catch (err: any) {
      console.error("Failed to download image", err);
      alert(`Gagal mengunduh gambar: ${err.message || "Unknown error"}`);
    }
  };

  // --- 1. KPI Achievement Chart Data ---
  const kpiLabels = [
    "TTI INDIHOME",
    "FFG INDIBIZ",
    "TTI INDIBIZ",
    "FFG INDIHOME",
    "TTR-FFG INDIHOME",
    "TTR-FFG INDIBIZ",
  ];

  const kpiDataRaw = [
    summary["TTI INDIHOME"]?.achievement || 0,
    summary["FFG INDIBIZ"]?.achievement || 0,
    summary["TTI INDIBIZ"]?.achievement || 0,
    summary["GARANSI INDIHOME"]?.achievement || 0,
    summary["FFG INDIHOME"]?.achievement || 0,
    summary["FFG INDIBIZ"]?.achievement || 0,
  ];

  const kpiColors = kpiLabels.map((l) =>
    l.includes("INDIHOME") ? "rgba(239, 68, 68, 0.8)" : "rgba(59, 130, 246, 0.8)"
  );

  const kpiChartData = {
    labels: kpiLabels,
    datasets: [
      {
        label: "Achievement KPI",
        data: kpiDataRaw,
        backgroundColor: kpiColors,
        borderRadius: 8,
      },
    ],
  };

  const kpiChartOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.x !== null) {
              label += Number(context.parsed.x).toFixed(2) + '%';
            }
            return label;
          }
        }
      },
      datalabels: {
        color: "#fff",
        anchor: "end" as const,
        align: "start" as const,
        formatter: (value: number) => `${Number(value).toFixed(2)}%`,
        font: { weight: "bold" as const },
      },
    },
    scales: {
      x: { max: 100, ticks: { callback: (val: any) => `${val}%` } },
    },
  };

  // --- 2. Ranking Service Area Chart Data ---
  const sortedRanking = [...rankingSA].sort((a, b) => b.achievement - a.achievement);
  const rankingChartData = {
    labels: sortedRanking.map((r) => r.sa),
    datasets: [
      {
        label: "Ranking Service Area",
        data: sortedRanking.map((r) => r.achievement),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#10b981",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const rankingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += Number(context.parsed.y).toFixed(2) + '%';
            }
            return label;
          }
        }
      },
      datalabels: {
        color: "#1f2937",
        anchor: "end" as const,
        align: "top" as const,
        formatter: (value: number) => `${Number(value).toFixed(2)}%`,
        font: { weight: "bold" as const, size: 10 },
      },
    },
    scales: {
      y: { max: 100, ticks: { callback: (val: any) => `${val}%` } },
    },
  };

  // --- 3. Top Symptom Aggregation Helper ---
  const getTopSymptoms = (tickets: Ticket[], filterNotc: boolean) => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      if (t.NULL_GDOC || t.SYMTOM === "NULL GDOC") return;
      if (filterNotc && !t.STATUS.includes("-NOTC")) return;
      
      const sym = t.SYMTOM.trim();
      if (!sym) return;
      counts[sym] = (counts[sym] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  const filteredTtiTickets = useMemo(() => {
    return ttiTickets.filter(t => segment === 'indihome' ? t.kpi?.includes('IH') : t.kpi?.includes('IB'));
  }, [ttiTickets, segment]);

  const filteredFfgTickets = useMemo(() => {
    return ffgTickets.filter(t => segment === 'indihome' ? t.kpi?.includes('IH') : t.kpi?.includes('IB'));
  }, [ffgTickets, segment]);

  const topTtiNotc = useMemo(() => getTopSymptoms(filteredTtiTickets, true), [filteredTtiTickets]);
  const topFfg = useMemo(() => getTopSymptoms(filteredFfgTickets, false), [filteredFfgTickets]);

  const ttiChartData = {
    labels: topTtiNotc.map((s) => s[0]),
    datasets: [
      {
        data: topTtiNotc.map((s) => s[1]),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const ffgChartData = {
    labels: topFfg.map((s) => s[0]),
    datasets: [
      {
        data: topFfg.map((s) => s[1]),
        backgroundColor: "rgba(245, 158, 11, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const symptomChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: "#1f2937",
        anchor: "end" as const,
        align: "top" as const,
        font: { weight: "bold" as const },
      },
    },
    scales: {
      x: {
        ticks: { maxRotation: 45, minRotation: 45, font: { size: 9 } },
      },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters and Download */}
      <div>
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
             {[
               { id: 'overall', label: 'Overall Achievement' },
               { id: 'tti', label: config.tti.title },
               { id: 'ffg', label: config.ffg.title },
               { id: 'garansi', label: config.garansi.title },
               { id: 'pspi', label: 'Saldo PS/PI' },
               { id: 'unspec', label: 'UNSPEC' }
             ].map(opt => (
               <label key={opt.id} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground bg-[var(--surface-hover)] px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors hover:bg-[var(--border)]">
                 <input 
                   type="checkbox" 
                   checked={selectedTables.includes(opt.id)} 
                   onChange={() => toggleTable(opt.id)} 
                   className="w-4 h-4 text-accent-blue bg-background border-[var(--border)] rounded focus:ring-accent-blue" 
                 />
                 {opt.label}
               </label>
             ))}
          </div>
          
          <div className="flex gap-2">
            {/* Send to Telegram Button (Admin Only) */}
            {isLoggedIn && (
              <button
                onClick={handleSendTelegram}
                disabled={isSendingTelegram}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm shadow-blue-500/20 whitespace-nowrap disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                {isSendingTelegram ? "Sending..." : "Send Telegram"}
              </button>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownloadPNG}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm shadow-emerald-500/20 whitespace-nowrap"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download PNG
            </button>
          </div>
        </div>
        
        {/* Tables — captured for PNG download */}
        <div ref={tablesRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-2 -m-2 bg-background">
          {selectedTables.includes('overall') && <MiniRankingTable title="Overall Achievement" dataKey="achievement" data={rankingSA} />}
          {selectedTables.includes('tti') && (
            <MiniRankingTable 
              title={
                <div className="flex items-center gap-2">
                  <span>{config.tti.title}</span>
                  {segment === "indibiz" && (
                    <span className="text-xs bg-[var(--surface-hover)] border border-[var(--border)] text-foreground-muted px-2 py-0.5 rounded-full normal-case tracking-normal font-medium">
                      {ttiIbFilteredTicketsCount} Ticket
                    </span>
                  )}
                </div>
              }
              dataKey={config.tti.key} 
              data={filteredRankingSA} 
              isCount={segment === "indibiz" && ttiIbStatusFilter !== "ALL"}
              invertBadge={segment === "indibiz" && ttiIbStatusFilter === "NOTC"}
              headerAddon={
                segment === "indibiz" && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button 
                        onClick={() => setIsOrderTypeDropdownOpen(!isOrderTypeDropdownOpen)}
                        className="text-xs font-normal bg-[var(--surface-hover)] border border-[var(--border)] text-foreground rounded px-2 py-1 flex items-center justify-between min-w-[110px] outline-none focus:ring-1 focus:ring-accent-blue text-left"
                      >
                        <span className="truncate max-w-[90px]">
                          {ttiIbOrderTypeFilter.length === 0 ? "All Orders" : `${ttiIbOrderTypeFilter.length} Selected`}
                        </span>
                        <svg className="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      
                      {isOrderTypeDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsOrderTypeDropdownOpen(false)}></div>
                          <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--surface-hover)] border border-[var(--border)] rounded shadow-xl z-50 py-1 flex flex-col max-h-[250px] overflow-y-auto">
                            <label className="flex items-center px-3 py-1.5 hover:bg-[var(--border)] cursor-pointer text-xs transition-colors">
                              <input 
                                type="checkbox" 
                                className="mr-2 rounded border-[var(--border)] text-accent-blue focus:ring-accent-blue bg-background"
                                checked={ttiIbOrderTypeFilter.length === 0}
                                onChange={() => {
                                  setTtiIbOrderTypeFilter([]);
                                  setIsOrderTypeDropdownOpen(false);
                                }}
                              />
                              <div className="flex justify-between w-full items-center">
                                <span className="font-medium text-foreground">All Orders</span>
                                <span className="text-foreground-muted ml-2 bg-background px-1.5 py-0.5 rounded-md text-[10px] border border-[var(--border)]">{ttiIbOrderTypes.allCount}</span>
                              </div>
                            </label>
                            <div className="h-px bg-[var(--border)] my-1"></div>
                            {ttiIbOrderTypes.types.map(item => (
                              <label key={item.type} className="flex items-center px-3 py-1.5 hover:bg-[var(--border)] cursor-pointer text-xs transition-colors">
                                <input 
                                  type="checkbox" 
                                  className="mr-2 rounded border-[var(--border)] text-accent-blue focus:ring-accent-blue bg-background"
                                  checked={ttiIbOrderTypeFilter.includes(item.type)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTtiIbOrderTypeFilter(prev => [...prev, item.type]);
                                    } else {
                                      setTtiIbOrderTypeFilter(prev => prev.filter(t => t !== item.type));
                                    }
                                  }}
                                />
                                <div className="flex justify-between w-full items-center">
                                  <span className="text-foreground truncate pr-2">{item.type || "Unknown"}</span>
                                  <span className="text-foreground-muted ml-2 bg-background px-1.5 py-0.5 rounded-md text-[10px] border border-[var(--border)] whitespace-nowrap">{item.count}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <select
                      className="text-xs font-normal bg-[var(--surface-hover)] border border-[var(--border)] text-foreground rounded px-2 py-1 outline-none focus:ring-1 focus:ring-accent-blue"
                      value={ttiIbStatusFilter}
                      onChange={(e) => setTtiIbStatusFilter(e.target.value as any)}
                    >
                      <option value="ALL">Achievement</option>
                      <option value="COMP">Comply</option>
                      <option value="NOTC">Non-Comply</option>
                    </select>
                  </div>
                )
              }
            />
          )}
          {selectedTables.includes('ffg') && <MiniRankingTable title={config.ffg.title} dataKey={config.ffg.key} data={rankingSA} />}
          {selectedTables.includes('garansi') && <MiniRankingTable title={config.garansi.title} dataKey={config.garansi.key} data={rankingSA} />}
          {selectedTables.includes('pspi') && <MiniRankingTable title="Saldo PS/PI" dataKey="score" data={pspiRankingData} />}
          {selectedTables.includes('unspec') && <MiniRankingTable title="UNSPEC" dataKey="score" data={unspecRankingData} />}
        </div>
      </div>

      {/* 2x2 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 h-[420px] flex flex-col">
          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
            KPI Achievement
          </h3>
          <div className="flex-1 min-h-0 relative">
            <Bar data={kpiChartData} options={kpiChartOptions} />
          </div>
        </div>

        <div className="glass-card p-5 h-[420px] flex flex-col relative">
          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
            Ranking Service Area
          </h3>
          <div className="absolute top-5 right-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] px-2 py-1 rounded">
            score = (TTI-IH + FFG-IH + TTR FFG-IH + TTI-IB + FFG-IB + TTR FFG-IB) / 6
          </div>
          <div className="flex-1 min-h-0 mt-4 relative">
            <Line data={rankingChartData} options={rankingChartOptions} />
          </div>
        </div>

        <div className="glass-card p-5 h-[420px] flex flex-col">
          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
            TOP SYMTOM TTI NOTC
          </h3>
          <div className="flex-1 min-h-0 relative">
            <Bar data={ttiChartData} options={symptomChartOptions} />
          </div>
        </div>

        <div className="glass-card p-5 h-[420px] flex flex-col">
          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
            TOP SYMTOM FFG
          </h3>
          <div className="flex-1 min-h-0 relative">
            <Bar data={ffgChartData} options={symptomChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniRankingTable({ title, dataKey, data, headerAddon, isCount = false, invertBadge = false }: { title: React.ReactNode, dataKey: string, data: any[], headerAddon?: React.ReactNode, isCount?: boolean, invertBadge?: boolean }) {
  const sorted = [...data].sort((a, b) => (b[dataKey] as number) - (a[dataKey] as number));
  
  return (
    <div className="glass-card p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center">{title}</h3>
        {headerAddon}
      </div>
      <div className="overflow-x-auto border border-[var(--border)] rounded-lg bg-background">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#111827] text-white">
            <tr>
              <th className="px-3 py-2 text-center w-10">#</th>
              <th className="px-3 py-2 font-semibold">SERVICE AREA</th>
              <th className="px-3 py-2 font-semibold text-center">{isCount ? "TOTAL" : "SCORE"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.map((r, i) => {
              const val = r[dataKey] as number;
              const medals = ["🥇", "🥈", "🥉"];
              const rankDisplay = i < 3 ? medals[i] : (i + 1);
              
              let badgeVar: "default" | "danger" | "info" = "default";
              if (isCount) {
                if (invertBadge) badgeVar = val > 0 ? "danger" : "default";
                else badgeVar = val > 0 ? "default" : "danger";
              } else {
                badgeVar = val >= 90 ? "default" : "danger";
              }

              return (
                <tr key={r.sa} className="hover:bg-[var(--surface-hover)]">
                  <td className="px-3 py-2 text-center text-foreground-muted">{rankDisplay}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{r.sa}</td>
                  <td className="px-3 py-2 text-center font-mono">
                    <Badge variant={badgeVar} className="text-[10px] py-0.5">
                      {isCount ? val : formatPercent(val)}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

