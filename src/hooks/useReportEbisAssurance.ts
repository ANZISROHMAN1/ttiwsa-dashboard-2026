"use client";

import useSWR from "swr";
import { useEffect, useCallback } from "react";
import type { DistrictData } from "@/types/report-ih-eastern";

interface UseReportEbisAssuranceReturn {
  data: DistrictData[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API error: ${res.status}`);
  }
  return res.json();
};

/**
 * Client-side hook for fetching EBIS Assurance data (API_ASS_EBIS).
 */
export function useReportEbisAssurance(): UseReportEbisAssuranceReturn {
  const { data, error, isLoading, mutate } = useSWR<DistrictData[]>(
    "/api/report-ebis-assurance",
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const refetch = useCallback(async () => {
    const freshData = await fetcher("/api/report-ebis-assurance?refresh=true");
    mutate(freshData, false);
  }, [mutate]);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      refetch();
    };
    window.addEventListener("global-refresh", handleGlobalRefresh);

    return () => {
      window.removeEventListener("global-refresh", handleGlobalRefresh);
    };
  }, [refetch]);

  return {
    data: data || null,
    isLoading,
    error: error?.message || null,
    refetch,
  };
}
