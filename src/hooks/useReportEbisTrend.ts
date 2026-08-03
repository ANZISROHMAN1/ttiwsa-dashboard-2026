"use client";

import useSWR from "swr";
import { useEffect, useCallback } from "react";
import type { IHTrendResponse } from "@/types/report-ih-eastern";

interface UseReportEbisTrendReturn {
  data: IHTrendResponse | null;
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
 * Client-side hook for fetching EBIS monthly trend data (API_IB_TIGABULAN).
 * Returns trend values per STO across Jan–Dec 2026, grouped by parameter.
 */
export function useReportEbisTrend(): UseReportEbisTrendReturn {
  const { data, error, isLoading, mutate } = useSWR<IHTrendResponse>(
    "/api/report-ebis-trend",
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const refetch = useCallback(async () => {
    const freshData = await fetcher("/api/report-ebis-trend?refresh=true");
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
