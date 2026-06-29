"use client";

import { useMemo } from "react";
import { useDashboard } from "../layout";
import { SubmitForm } from "@/components/dashboard/SubmitForm";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { getUniqueServiceAreas, getUniqueSTOs } from "@/lib/utils";

export default function SubmitPage() {
  const { data, isLoading } = useDashboard();

  const stoList = useMemo(
    () => (data ? getUniqueSTOs(data.ttiTickets) : []),
    [data]
  );

  if (isLoading || !data) {
    return <PageSkeleton />;
  }

  return <SubmitForm stoList={stoList} />;
}
