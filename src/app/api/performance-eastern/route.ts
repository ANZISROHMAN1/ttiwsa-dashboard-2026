import { NextResponse } from "next/server";
import { PERFORMANCE_EASTERN_SHEET_URL } from "@/lib/constants";
import { getCachedData, setCachedData } from "@/lib/redisCache";
import { parsePerformanceEasternCSV } from "@/lib/performanceEasternParser";
import type { PerformanceEasternData } from "@/types/performance-eastern";

export const dynamic = "force-dynamic";

// In-memory fallback cache (60s TTL)
let memoryCache: { data: PerformanceEasternData; timestamp: number } | null = null;
const MEMORY_CACHE_TTL = 60 * 1000;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = "performance_eastern_data";

    if (!refresh) {
      // 1. Try Redis
      const cached = await getCachedData<PerformanceEasternData>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      // 2. Try In-memory fallback
      if (memoryCache && Date.now() - memoryCache.timestamp < MEMORY_CACHE_TTL) {
        return NextResponse.json(memoryCache.data);
      }
    }

    if (!PERFORMANCE_EASTERN_SHEET_URL) {
      return NextResponse.json(
        { error: "PERFORMANCE_EASTERN_SHEET_URL is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(PERFORMANCE_EASTERN_SHEET_URL, {
      signal: request.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google Sheet fetch failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const csvText = await response.text();
    const data = parsePerformanceEasternCSV(csvText);

    // Update caches
    memoryCache = { data, timestamp: Date.now() };
    await setCachedData(cacheKey, data, 60);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Request aborted" }, { status: 499 });
    }
    console.error("Performance Eastern API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Performance Eastern data" },
      { status: 500 }
    );
  }
}

