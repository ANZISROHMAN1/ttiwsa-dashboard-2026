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
        const parsedData = Array.isArray(json) 
          ? json 
          : Array.isArray(json?.value) 
            ? json.value 
            : [];
            
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
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}
