"use client";

import { useDashboard } from "../layout";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function LeaderboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <PageSkeleton />;
  }

  return (
    <PerformanceTable
      mode="leaderboard"
      rankingSA={data.rankingSA}
      rankingSTO={data.rankingSTO}
      summary={data.summary}
      branchBogor={data.branchBogor}
      branchBogorIncludeBanten={data.branchBogorIncludeBanten}
      ttiTickets={data.ttiTickets}
      ffgTickets={data.ffgTickets}
      saldoPspiTickets={data.saldoPspiTickets}
      unspecTickets={data.unspecTickets}
    />
  );
}
