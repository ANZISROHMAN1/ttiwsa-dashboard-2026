"use client";

import { useMemo, useRef } from "react";
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
import { formatPercent } from "@/lib/utils";
import type { DashboardSummary, RankingSA, KPISimulation, Ticket } from "@/types/dashboard";

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

interface DipisahViewProps {
  summary: DashboardSummary;
  rankingSA: RankingSA[];
  branchBogor: KPISimulation[];
  branchBogorIncludeBanten: KPISimulation[];
  ttiTickets: Ticket[];
  ffgTickets: Ticket[];
}

export function DipisahView({
  summary,
  rankingSA,
  branchBogor,
  branchBogorIncludeBanten,
  ttiTickets,
  ffgTickets,
}: DipisahViewProps) {
  const tablesRef = useRef<HTMLDivElement>(null);

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
      link.download = `kpi-tables-${dateStr}.png`;
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
    summary["FFG INDIBIZ"]?.achievement || 0, // Assuming this is how they map it based on the previous script
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
      datalabels: {
        color: "#fff",
        anchor: "end" as const,
        align: "start" as const,
        formatter: (value: number) => `${value}%`,
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
      datalabels: {
        color: "#1f2937",
        anchor: "end" as const,
        align: "top" as const,
        formatter: (value: number) => `${value.toFixed(2)}%`,
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

  const topTtiNotc = useMemo(() => getTopSymptoms(ttiTickets, true), [ttiTickets]);
  const topFfg = useMemo(() => getTopSymptoms(ffgTickets, false), [ffgTickets]);

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
      {/* Download Action & 2x2 Tables Section */}
      <div>
        <div className="flex justify-end mb-3">
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm shadow-emerald-500/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Download PNG
          </button>
        </div>
        
        {/* We wrap the grid in a ref to capture it. Padding ensures shadows and borders are not clipped. */}
        <div ref={tablesRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2 -m-2 bg-background">
          <MiniRankingTable title="Overall Achievement" dataKey="achievement" data={rankingSA} />
          <MiniRankingTable title="TTI 3x24 Indihome" dataKey="ttiIH" data={rankingSA} />
          <MiniRankingTable title="TTR FFG Indihome" dataKey="ffgIH" data={rankingSA} />
          <MiniRankingTable title="FFG Indihome (Garansi)" dataKey="garansiIH" data={rankingSA} />
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

function MiniRankingTable({ title, dataKey, data }: { title: string, dataKey: keyof RankingSA, data: RankingSA[] }) {
  const sorted = [...data].sort((a, b) => (b[dataKey] as number) - (a[dataKey] as number));
  
  return (
    <div className="glass-card p-4 flex flex-col">
      <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">{title}</h3>
      <div className="overflow-x-auto border border-[var(--border)] rounded-lg bg-background">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#111827] text-white">
            <tr>
              <th className="px-3 py-2 text-center w-10">#</th>
              <th className="px-3 py-2 font-semibold">SERVICE AREA</th>
              <th className="px-3 py-2 font-semibold text-center">SCORE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.map((r, i) => {
              const val = r[dataKey] as number;
              const medals = ["🥇", "🥈", "🥉"];
              const rankDisplay = i < 3 ? medals[i] : (i + 1);
              const isAchieve = val >= 90; // rough threshold

              return (
                <tr key={r.sa} className="hover:bg-[var(--surface-hover)]">
                  <td className="px-3 py-2 text-center text-foreground-muted">{rankDisplay}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{r.sa}</td>
                  <td className="px-3 py-2 text-center font-mono">
                    <Badge variant={isAchieve ? "default" : "danger"} className="text-[10px] py-0.5">
                      {formatPercent(val)}
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

