"use client";

import { useDashboard } from "../layout";
import { KpiAnalysis } from "@/components/dashboard/SymptomRanking";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function SymptomsPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <PageSkeleton />;
  }

  const allTickets = [...data.ttiTickets, ...data.ffgTickets];

  return (
    <KpiAnalysis
      tickets={allTickets}
      kpiSimulation={data.kpiSimulation}
      branchBogor={data.branchBogor}
    />
  );
}
