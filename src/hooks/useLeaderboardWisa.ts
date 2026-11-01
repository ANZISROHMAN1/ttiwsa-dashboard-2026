"use client";

import useSWR from "swr";
import { useEffect, useCallback } from "react";
import type { LeaderboardWisaData } from "@/types/leaderboard-wisa";

interface UseLeaderboardWisaReturn {
  data: LeaderboardWisaData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const fetcher = async (url: string): Promise<LeaderboardWisaData> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API error: ${res.status}`);
  }
  return res.json();
};

export function useLeaderboardWisa(): UseLeaderboardWisaReturn {
  const { data, error, isLoading, mutate } = useSWR<LeaderboardWisaData>(
    "/api/leaderboard-wisa",
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const refetch = useCallback(async () => {
    try {
      const freshData = await fetcher("/api/leaderboard-wisa?refresh=true");
      mutate(freshData, false);
    } catch (err) {
      console.error("Failed to refetch leaderboard-wisa:", err);
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
    data: data ?? null,
    isLoading,
    error: error ? error.message : null,
    refetch,
  };
}

