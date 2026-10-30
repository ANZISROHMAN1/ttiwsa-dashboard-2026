"use client";

import useSWR from "swr";
import { useEffect, useCallback } from "react";
import type { PerformanceEasternData } from "@/types/performance-eastern";

interface UsePerformanceEasternReturn {
  data: PerformanceEasternData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const fetcher = async (url: string): Promise<PerformanceEasternData> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API error: ${res.status}`);
  }
  return res.json();
};

export function usePerformanceEastern(): UsePerformanceEasternReturn {
  const { data, error, isLoading, mutate } = useSWR<PerformanceEasternData>(
    "/api/performance-eastern",
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const refetch = useCallback(async () => {
    try {
      const freshData = await fetcher("/api/performance-eastern?refresh=true");
      mutate(freshData, false);
    } catch (err) {
      console.error("Failed to refetch performance-eastern:", err);
    }
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

