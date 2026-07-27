"use client";

import useSWR from "swr";
import { useCallback, useState, useEffect } from "react";
import type { DashboardData } from "@/types/dashboard";

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: string | null;
  lastUpdated: Date | null;
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
 * Custom hook for fetching and auto-refreshing dashboard data.
 * Utilizes SWR for caching and background polling.
 */
export function useDashboardData(basic: boolean = false): UseDashboardDataReturn {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    `/api/dashboard?basic=${basic}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
    }
  }, [data]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    try {
      const freshData = await fetcher(`/api/dashboard?basic=${basic}&refresh=true`);
      mutate(freshData, false); // Update SWR cache without re-fetching
    } catch (err) {
      console.error("Manual refresh failed:", err);
    } finally {
      setIsRefetching(false);
    }
  }, [basic, mutate]);

  return {
    data: data || null,
    isLoading,
    isRefetching,
    error: error?.message || null,
    lastUpdated,
    refetch,
  };
}
