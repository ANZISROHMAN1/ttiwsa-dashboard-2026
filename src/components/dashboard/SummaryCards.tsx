"use client";

import { MetricCard } from "@/components/ui/Card";
import type { DashboardSummary } from "@/types/dashboard";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const defaultMetric = { comply: 0, notcomply: 0, target: 0, achievement: 0 };
  const defaultGaransi = { totalPS: 0, totalTicket: 0, achievement: 0 };

  const ttiIH = summary["TTI INDIHOME"] || defaultMetric;
  const ffgIH = summary["FFG INDIHOME"] || defaultMetric;
  const ttiIB = summary["TTI INDIBIZ"] || defaultMetric;
  const ffgIB = summary["FFG INDIBIZ"] || defaultMetric;
  const garansiIH = summary["GARANSI INDIHOME"] || defaultGaransi;
  const garansiIB = summary["GARANSI INDIBIZ"] || defaultGaransi;

  return (
    <div className="space-y-6">
      {/* Indihome Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-accent-blue" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Indihome
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          <MetricCard
            title="TTI 3x24 Indihome"
            achievement={ttiIH.achievement}
            comply={ttiIH.comply}
            notComply={ttiIH.notcomply}
            target={ttiIH.target}
            gradient="blue"
          />
          <MetricCard
            title="TTR FFG Indihome"
            achievement={ffgIH.achievement}
            comply={ffgIH.comply}
            notComply={ffgIH.notcomply}
            target={ffgIH.target}
            gradient="violet"
          />
          <MetricCard
            title="FFG Indihome"
            achievement={garansiIH.achievement}
            totalPS={garansiIH.totalPS}
            totalTicket={garansiIH.totalTicket}
            gradient="emerald"
          />
        </div>
      </div>

      {/* Indibiz Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-accent-amber" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Indibiz
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          <MetricCard
            title="TTI 1x24 Indibiz"
            achievement={ttiIB.achievement}
            comply={ttiIB.comply}
            notComply={ttiIB.notcomply}
            target={ttiIB.target}
            gradient="amber"
          />
          <MetricCard
            title="TTR FFG Indibiz"
            achievement={ffgIB.achievement}
            comply={ffgIB.comply}
            notComply={ffgIB.notcomply}
            target={ffgIB.target}
            gradient="rose"
          />
          <MetricCard
            title="FFG Indibiz"
            achievement={garansiIB.achievement}
            totalPS={garansiIB.totalPS}
            totalTicket={garansiIB.totalTicket}
            gradient="emerald"
          />
        </div>
      </div>
    </div>
  );
}
