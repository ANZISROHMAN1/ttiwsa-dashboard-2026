"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { KpiAnalysis } from "@/components/dashboard/SymptomRanking";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function SymptomsPage() {
  const { data, isLoading } = useDashboardData(false);

  if (isLoading || !data) {
    return <PageSkeleton />;
  }

  const allTickets = [...data.ttiTickets, ...data.ffgTickets];

  return (
    <KpiAnalysis
      tickets={allTickets}
      kpiSimulation={data.kpiSimulation}
      branchBogor={data.branchBogor}
      saldoPspiTickets={data.saldoPspiTickets}
      unspecTickets={data.unspecTickets}
    />
  );
}
