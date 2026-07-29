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
  refetchTarget: (target: "regular" | "pspi" | "unspec" | "all") => Promise<void>;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API error: ${res.status}`);
  }
  return res.json();
};

/**
 * Global helper to trigger targeted API refresh and update SWR cache.
 */
export async function refreshTargetApi(target: "regular" | "pspi" | "unspec" | "all") {
  try {
    const freshData = await fetcher(`/api/dashboard?basic=false&refreshTarget=${target}`);
    const { mutate: globalMutate } = await import("swr");
    globalMutate("/api/dashboard?basic=false", freshData, false);
    globalMutate("/api/dashboard?basic=true");
    return freshData;
  } catch (err) {
    console.error(`Targeted refresh for ${target} failed:`, err);
  }
}

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

  const refetchTarget = useCallback(
    async (target: "regular" | "pspi" | "unspec" | "all") => {
      setIsRefetching(true);
      try {
        const freshData = await fetcher(`/api/dashboard?basic=${basic}&refreshTarget=${target}`);
        mutate(freshData, false);
      } catch (err) {
        console.error(`Targeted refresh (${target}) failed:`, err);
      } finally {
        setIsRefetching(false);
      }
    },
    [basic, mutate]
  );

  return {
    data: data || null,
    isLoading,
    isRefetching,
    error: error?.message || null,
    lastUpdated,
    refetch,
    refetchTarget,
  };
}

