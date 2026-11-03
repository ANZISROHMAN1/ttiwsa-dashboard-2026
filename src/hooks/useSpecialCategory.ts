"use client";

import useSWR from "swr";
import { useEffect, useCallback } from "react";
import type { SpecialCategoryData } from "@/types/special-category";
import defaultData from "@/data/specialCategoryDefault.json";

interface UseSpecialCategoryReturn {
  data: SpecialCategoryData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const fallback = defaultData as unknown as SpecialCategoryData;

const fetcher = async (url: string): Promise<SpecialCategoryData> => {
  const res = await fetch(url);
  if (!res.ok) {
    return fallback;
  }
  return res.json();
};

export function useSpecialCategory(): UseSpecialCategoryReturn {
  const { data, error, isLoading, mutate } = useSWR<SpecialCategoryData>(
    "/api/special-category",
    fetcher,
    {
      fallbackData: fallback,
      refreshInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  const refetch = useCallback(async () => {
    try {
      const freshData = await fetcher("/api/special-category?refresh=true");
      mutate(freshData, false);
    } catch (err) {
      console.error("Failed to refetch special-category:", err);
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
    data: data || fallback,
    isLoading,
    error: error ? error.message : null,
    refetch,
  };
}

