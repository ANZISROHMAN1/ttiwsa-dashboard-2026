"use client";

import useSWR from "swr";
import { useEffect, useCallback } from "react";
import type { FrameworkData } from "@/types/report-all-eastern";

interface UseReportAllEasternReturn {
  data: FrameworkData[] | null;
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
 * Client-side hook for fetching Report All Eastern data (framework data).
 */
export function useReportAllEastern(): UseReportAllEasternReturn {
  const { data, error, isLoading, mutate } = useSWR<FrameworkData[]>(
    "/api/report-all-eastern",
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const refetch = useCallback(async () => {
    const freshData = await fetcher("/api/report-all-eastern?refresh=true");
    mutate(freshData, false);
  }, [mutate]);

  useEffect(() => {
    // Listen to global refresh (triggered by Header button)
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
