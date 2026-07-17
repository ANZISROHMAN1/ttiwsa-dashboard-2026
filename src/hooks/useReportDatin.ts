import { useState, useEffect, useCallback, useRef } from "react";
import type { DistrictData } from "@/types/report-ih-eastern";

export function useReportDatin() {
  const [data, setData] = useState<DistrictData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchReport = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/report-datin", { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch report data: ${res.status}`);
      }
      
      const json = await res.json();
      
      if (!controller.signal.aborted) {
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
            
        setData(parsedData);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("Error fetching report data:", err);
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchReport();

    // Listen to global refresh (triggered by Header button)
    const handleGlobalRefresh = () => {
      fetchReport();
    };
    window.addEventListener("global-refresh", handleGlobalRefresh);

    return () => {
      window.removeEventListener("global-refresh", handleGlobalRefresh);
      abortControllerRef.current?.abort();
    };
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}
