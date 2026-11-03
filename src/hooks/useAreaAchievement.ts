"use client";

import useSWR from "swr";
import { useEffect, useCallback } from "react";
import type { AreaAchievementData } from "@/types/area-achievement";
import defaultData from "@/data/areaAchievementDefault.json";

interface UseAreaAchievementReturn {
  data: AreaAchievementData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const fallback = defaultData as unknown as AreaAchievementData;

const fetcher = async (url: string): Promise<AreaAchievementData> => {
  const res = await fetch(url);
  if (!res.ok) {
    return fallback;
  }
  return res.json();
};

export function useAreaAchievement(): UseAreaAchievementReturn {
  const { data, error, isLoading, mutate } = useSWR<AreaAchievementData>(
    "/api/area-achievement",
    fetcher,
    {
      fallbackData: fallback,
      refreshInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  const refetch = useCallback(async () => {
    try {
      const freshData = await fetcher("/api/area-achievement?refresh=true");
      mutate(freshData, false);
    } catch (err) {
      console.error("Failed to refetch area-achievement:", err);
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

