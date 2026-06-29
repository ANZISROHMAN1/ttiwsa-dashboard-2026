"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { aggregateSymptomsBySA, getUniqueServiceAreas, formatPercent } from "@/lib/utils";
import { KPI_SIM_LABELS } from "@/lib/constants";
import type { Ticket, KPISimulation } from "@/types/dashboard";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface KpiAnalysisProps {
  tickets: Ticket[];
  kpiSimulation: KPISimulation[];
  branchBogor: KPISimulation[];
}

export function KpiAnalysis({ tickets, kpiSimulation, branchBogor }: KpiAnalysisProps) {
  const uniqueSAs = useMemo(() => getUniqueServiceAreas(tickets), [tickets]);
  const [selectedSA, setSelectedSA] = useState<string>("BRANCH BOGOR");
  const [selectedKpiCard, setSelectedKpiCard] = useState<string | null>(null);

  const filteredTickets = useMemo(() => {
    if (!selectedKpiCard) return tickets;
    return tickets.filter((t) => {
      const isTTI = selectedKpiCard.includes("TTI");
      if (isTTI) return t.STATUS.startsWith("TTI-");
      return t.STATUS.startsWith("TTR-");
    });
  }, [tickets, selectedKpiCard]);

  const symptomsBySA = useMemo(() => aggregateSymptomsBySA(filteredTickets), [filteredTickets]);

  // Find symptom data for the selected SA (or aggregate all if Branch Bogor)
  const selectedSymptomData = useMemo(() => {
    if (selectedSA === "BRANCH BOGOR") {
      // Aggregate everything (since we exclude nothing for simplicity unless specified)
      // Or we can just sum up the counts from symptomsBySA
      const aggregated = new Map<string, { symptom: string; total: number; comp: number; nonc: number }>();
      let totalTickets = 0;
      let totalComp = 0;
      let totalNonc = 0;

      symptomsBySA.forEach((saData) => {
        totalTickets += saData.totalTickets;
        totalComp += saData.totalComp;
        totalNonc += saData.totalNonc;
        saData.symptoms.forEach((s) => {
          const ex = aggregated.get(s.symptom);
          if (ex) {
            ex.total += s.total;
            ex.comp += s.comp;
            ex.nonc += s.nonc;
          } else {
            aggregated.set(s.symptom, { ...s });
          }
        });
      });

      return {
        sa: "BRANCH BOGOR",
        totalTickets,
        totalComp,
        totalNonc,
        symptoms: Array.from(aggregated.values()).sort((a, b) => b.total - a.total),
      };
    }

    return (
      symptomsBySA.find((s) => s.sa === selectedSA) || {
        sa: selectedSA,
        totalTickets: 0,
        totalComp: 0,
        totalNonc: 0,
        symptoms: [],
      }
    );
  }, [selectedSA, symptomsBySA]);

  // Find KPI simulations for the selected SA
  const selectedSimulation = useMemo(() => {
    if (selectedSA === "BRANCH BOGOR") {
      return branchBogor;
    }
    return kpiSimulation.filter((s) => s.sa === selectedSA);
  }, [selectedSA, kpiSimulation, branchBogor]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">KPI Analysis & Symptoms</h2>
          <p className="text-sm text-foreground-muted">
            Analyze achievement gaps and view related symptom drivers by area.
          </p>
        </div>
        <select
          id="sa-filter"
          className="form-input form-select max-w-[220px] text-sm"
          value={selectedSA}
          onChange={(e) => setSelectedSA(e.target.value)}
        >
          <option value="BRANCH BOGOR">BRANCH BOGOR</option>
          {uniqueSAs.map((sa) => (
            <option key={sa} value={sa}>
              {sa}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Simulation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {selectedSimulation.map((sim, idx) => {
          const isAchieve = sim.status === "ACHIEVE";
          const actualVal = parseFloat(sim.actual);
          const cardLabel = KPI_SIM_LABELS[sim.kpi] || sim.kpi;
          const isSelected = selectedKpiCard === cardLabel;

          return (
            <div
              key={idx}
              onClick={() => setSelectedKpiCard(isSelected ? null : cardLabel)}
              className={`glass-card p-5 border-l-4 cursor-pointer transition-all duration-200 ${
                isAchieve ? "border-l-emerald-500" : "border-l-rose-500"
              } ${isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01]"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-foreground text-sm tracking-wide">
                  {cardLabel}
                </h3>
                {isAchieve ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Actual</div>
                  <div
                    className={`text-2xl font-bold font-mono ${
                      isAchieve ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatPercent(actualVal)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-foreground-muted mb-1">Target</div>
                  <div className="text-lg font-medium font-mono text-foreground">
                    {formatPercent(sim.target)}
                  </div>
                </div>
              </div>
              <div
                className={`text-sm px-3 py-2 rounded-md font-medium ${
                  isAchieve
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {sim.action}
              </div>
            </div>
          );
        })}
        {selectedSimulation.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center text-foreground-muted">
            No KPI simulation data available for this area.
          </div>
        )}
      </div>

      {/* Symptoms Detail */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-hover)]">
          <h3 className="text-base font-semibold text-foreground">
            Symptom Breakdown ({selectedSA}) 
            {selectedKpiCard && <span className="ml-2 text-sm font-normal text-primary bg-primary/10 px-2 py-1 rounded-full">Filtered: {selectedKpiCard}</span>}
          </h3>
          <div className="flex gap-2">
            <Badge variant="info">Total: {selectedSymptomData.totalTickets}</Badge>
            <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              COMP: {selectedSymptomData.totalComp}
            </Badge>
            <Badge variant="danger">NONC: {selectedSymptomData.totalNonc}</Badge>
          </div>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-foreground-muted bg-[var(--surface)]">
                <th className="px-5 py-3 font-medium">Symptom</th>
                <th className="px-5 py-3 font-medium text-center">Total</th>
                <th className="px-5 py-3 font-medium text-center">COMP</th>
                <th className="px-5 py-3 font-medium text-center">NONC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {selectedSymptomData.symptoms.map((s) => (
                <tr key={s.symptom} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{s.symptom}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="font-mono">{s.total}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {s.comp > 0 ? (
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        {s.comp}
                      </Badge>
                    ) : (
                      <span className="text-foreground-muted font-mono">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {s.nonc > 0 ? (
                      <Badge variant="danger">{s.nonc}</Badge>
                    ) : (
                      <span className="text-foreground-muted font-mono">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {selectedSymptomData.symptoms.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-foreground-muted">
                    No tickets found for this area.
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
