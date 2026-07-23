"use client";

import useSWR from "swr";
import { useEffect, useCallback } from "react";
import type { DistrictData } from "@/types/report-ih-eastern";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch report data: ${res.status}`);
  }
  
  const json = await res.json();
  let parsedData = Array.isArray(json) 
    ? json 
    : Array.isArray(json?.value) 
      ? json.value 
      : [];
      
  // Filter out junk Service Areas (e.g., merged Google Sheet headers)
  parsedData = parsedData.map((district: DistrictData) => ({
    ...district,
    serviceAreas: district.serviceAreas?.filter(
      (sa) => !sa.serviceArea.toUpperCase().includes("KPI WISA")
    ) || []
  }));
      
  return parsedData;
};

export function useReportDatin() {
  const { data, error, isLoading, mutate } = useSWR<DistrictData[]>(
    "/api/report-datin",
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const fetchReport = useCallback(async () => {
    const freshData = await fetcher("/api/report-datin?refresh=true");
    mutate(freshData, false);
  }, [mutate]);

  useEffect(() => {
    // Listen to global refresh (triggered by Header button)
    const handleGlobalRefresh = () => {
      fetchReport();
    };
    window.addEventListener("global-refresh", handleGlobalRefresh);

    return () => {
      window.removeEventListener("global-refresh", handleGlobalRefresh);
    };
  }, [fetchReport]);

  return {
    data: data || null,
    isLoading,
    error: error?.message || null,
    refetch: fetchReport,
  };
}
