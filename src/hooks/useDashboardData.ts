"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DashboardData } from "@/types/dashboard";

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching and auto-refreshing dashboard data.
 * Handles loading states, errors, and race conditions via AbortController.
 */
export function useDashboardData(basic: boolean = true): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/dashboard?basic=${basic}`, { signal: controller.signal });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${res.status}`);
      }
      const result = await res.json();
      if (!controller.signal.aborted) {
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred";
      if (!controller.signal.aborted) {
        setError(message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);



  return { data, isLoading, error, lastUpdated, refetch: fetchData };
}
