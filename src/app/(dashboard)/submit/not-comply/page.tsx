"use client";

import { useMemo } from "react";
import { useDashboard } from "../../layout";
import { SubmitForm } from "@/components/dashboard/SubmitForm";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function NotComplySubmitPage() {
  const { data, isLoading } = useDashboard();

  const stoList = useMemo(
    () => (data ? Array.from(new Set(data.rankingSTO.map(r => r.sto))).sort() : []),
    [data]
  );

  if (isLoading || !data) {
    return <PageSkeleton />;
  }

  return <SubmitForm stoList={stoList} />;
}
