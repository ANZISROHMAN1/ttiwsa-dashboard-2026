"use client";

import useSWR from "swr";
import { useEffect, useCallback } from "react";
import type { DistrictData } from "@/types/report-ih-eastern";

interface UseReportEbisReturn {
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
  let parsedData = await res.json();
  
  // Filter out junk Service Areas (e.g., merged Google Sheet headers)
  if (Array.isArray(parsedData)) {
    parsedData = parsedData.map((district: DistrictData) => ({
      ...district,
      serviceAreas: district.serviceAreas?.filter(
        (sa) => !sa.serviceArea.toUpperCase().includes("KPI WISA")
      ) || []
    }));
  }
  
  return parsedData;
};

/**
 * Client-side hook for fetching Report EBIS data.
 * Utilizes SWR for caching and background polling.
 */
export function useReportEbis(): UseReportEbisReturn {
  const { data, error, isLoading, mutate } = useSWR<DistrictData[]>(
    "/api/report-ebis",
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const refetch = useCallback(async () => {
    const freshData = await fetcher("/api/report-ebis?refresh=true");
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
