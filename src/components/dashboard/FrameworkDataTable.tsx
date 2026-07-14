"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { FrameworkData, TimeMetric } from "@/types/report-all-eastern";

interface FrameworkDataTableProps {
  data: FrameworkData[];
  category: string;
}

// Format numbers, handling 'N/a' or 'No Ticket' strings
const formatValue = (val: string | number) => {
  if (val === 'N/a' || val === 'No Ticket' || val === null || val === undefined) return val;
  
  let numVal = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  if (isNaN(numVal)) return val;

  return numVal % 1 === 0 ? numVal : numVal.toFixed(2);
};

const formatAch = (val: string | number) => {
  if (val === 'N/a' || val === 'No Ticket' || val === null || val === undefined) return val;
  
  let numVal = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  if (isNaN(numVal)) return val;
  
  // Achievement is often returned as integer * 1000 (e.g. 99759 -> 99.759%)
  if (typeof val === 'number' && val > 1000) {
    numVal = val / 1000;
  }

  return (numVal % 1 === 0 ? numVal : numVal.toFixed(2)) + "%";
};

const getAchColor = (val: string | number) => {
  if (val === 'N/a' || val === 'No Ticket' || val === null || val === undefined) return "text-foreground-muted";
  
  let numVal = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  if (isNaN(numVal)) return "text-foreground-muted";
  
  if (typeof val === 'number' && val > 1000) {
    numVal = val / 1000;
  }
  
  return numVal >= 100 ? "text-emerald-500" : "text-amber-500";
};

export function FrameworkDataTable({ data, category }: FrameworkDataTableProps) {
  const filteredData = useMemo(() => {
    return data.filter(d => d.kategori === category);
  }, [data, category]);

  if (filteredData.length === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">No Data Found</h3>
        <p className="text-sm text-foreground-muted mt-1 max-w-md">
          There are no metrics available for the {category} category in this report.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in">
      {filteredData.map((row, idx) => (
        <div key={`${row.indikator}-${idx}`} className="glass-card flex flex-col justify-between hover:border-accent-blue/50 transition-colors">
          {/* Card Header */}
          <div className="p-5 pb-4 border-b border-[var(--border)] bg-[var(--surface-hover)] rounded-t-[inherit]">
            <h4 className="text-sm font-bold text-foreground leading-tight line-clamp-2" title={row.indikator}>
              {row.indikator}
            </h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold">
                {row.uic}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue font-bold tracking-wider uppercase">
                {row.district}
              </span>
            </div>
          </div>

          {/* Full Month Main KPIs */}
          <div className="p-5">
            <div className="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Full Month Performance
            </div>
            
            <div className="grid grid-cols-3 gap-2 bg-[var(--surface-hover)] rounded-xl p-3 border border-[var(--border)]">
              <div className="text-center">
                <div className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Target</div>
                <div className="text-sm font-medium text-foreground tabular-nums">
                  {formatValue(row.fullMonth?.target)}
                  <span className="text-[10px] text-foreground-muted ml-0.5">{row.satuan}</span>
                </div>
              </div>
              <div className="text-center border-l border-r border-[var(--border)]">
                <div className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Real</div>
                <div className="text-sm font-bold text-foreground tabular-nums">
                  {formatValue(row.fullMonth?.real)}
                  <span className="text-[10px] text-foreground-muted ml-0.5">{row.satuan}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Ach</div>
                <div className={cn("text-sm font-black tabular-nums", getAchColor(row.fullMonth?.ach))}>
                  {formatAch(row.fullMonth?.ach)}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Trend Footer */}
          <div className="p-5 pt-0 mt-auto">
            <div className="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue"></span>
              Weekly Trend
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Week 2', data: row.w2 },
                { label: 'Week 3', data: row.w3 },
                { label: 'Week 4', data: row.w4 },
              ].map((week) => (
                <div key={week.label} className="flex flex-col items-center justify-center p-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]">
                  <span className="text-[9px] text-foreground-muted uppercase tracking-wider mb-1">{week.label}</span>
                  <span className="text-xs font-semibold text-foreground tabular-nums leading-none mb-1">
                    {formatValue(week.data?.real)}
                  </span>
                  <span className={cn("text-[10px] font-bold leading-none", getAchColor(week.data?.ach))}>
                    {formatAch(week.data?.ach)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
