"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DistrictData } from "@/types/report-ih-eastern";

interface UseReportIHEasternReturn {
  data: DistrictData[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Client-side hook for fetching Report IH Eastern data.
 * Mirrors the pattern of useDashboardData.
 */
export function useReportIHEastern(): UseReportIHEasternReturn {
  const [data, setData] = useState<DistrictData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/report-ih-eastern", {
        signal: controller.signal,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${res.status}`);
      }
      const result = await res.json();
      if (!controller.signal.aborted) {
        let parsedData = result;
        
        // Filter out junk Service Areas (e.g., merged Google Sheet headers)
        if (Array.isArray(parsedData)) {
          parsedData = parsedData.map((district: DistrictData) => ({
            ...district,
            serviceAreas: district.serviceAreas?.filter(
              (sa) => !sa.serviceArea.toUpperCase().includes("KPI WISA")
            ) || []
          }));
        }
        
        setData(parsedData);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      if (!controller.signal.aborted) {
        setError(message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
