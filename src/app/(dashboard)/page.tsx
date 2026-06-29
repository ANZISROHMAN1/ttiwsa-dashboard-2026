"use client";

import { useDashboard } from "./layout";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { BarChart } from "@/components/ui/BarChart";
import { FfgDetailTable } from "@/components/dashboard/FfgDetailTable";

export default function OverviewPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards */}
      <SummaryCards summary={data.summary} />

      {/* Quick Rankings Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-5">
            Top Service Areas — Overall Achievement
          </h3>
          <BarChart
            items={data.rankingSA.slice(0, 7).map((sa) => ({
              label: sa.sa,
              value: sa.achievement,
              maxValue: 100,
            }))}
            maxValue={100}
            colorByValue
          />
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-5">
            Top STOs — Overall Achievement
          </h3>
          <BarChart
            items={data.rankingSTO.slice(0, 7).map((sto) => ({
              label: sto.sto,
              value: sto.achievement,
              maxValue: 100,
            }))}
            maxValue={100}
            colorByValue
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {data.rankingSA.length}
          </div>
          <div className="text-xs text-foreground-muted mt-1">Service Areas</div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {data.rankingSTO.length}
          </div>
          <div className="text-xs text-foreground-muted mt-1">STOs</div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {data.ttiTickets.length}
          </div>
          <div className="text-xs text-foreground-muted mt-1">TTI Tickets</div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {data.ttiTickets.filter((t) => !t.NULL_GDOC).length}
          </div>
          <div className="text-xs text-foreground-muted mt-1">With GDoc</div>
        </div>
      </div>

      {/* FFG Detail Section */}
      <div className="mt-8">
        <FfgDetailTable tickets={data.ffgTickets} />
      </div>
    </div>
  );
}
