import { NextResponse } from "next/server";
import { fetchDashboardData, ApiError } from "@/lib/api";
import { getCachedData, setCachedData } from "@/lib/redisCache";
import type { DashboardData } from "@/types/dashboard";

export const dynamic = "force-dynamic";

// In-memory fallback cache (120s TTL)
interface CacheEntry {
  data: DashboardData;
  timestamp: number;
}
const memoryCache: Record<string, CacheEntry> = {};
const MEMORY_CACHE_TTL = 120 * 1000;

// In-flight request deduplication
const inFlightRequests = new Map<string, Promise<DashboardData>>();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const basic = url.searchParams.get("basic") === "true";
    const refresh = url.searchParams.get("refresh") === "true";
    const refreshTargetRaw = url.searchParams.get("refreshTarget");
    const refreshTarget =
      (refreshTargetRaw as "regular" | "pspi" | "unspec" | "all" | null) ||
      (refresh ? "all" : undefined);

    const cacheKey = `dashboard_data_basic_${basic}`;

    // 1. If not forcing a refresh, check Redis or In-Memory Cache
    if (!refresh && !refreshTarget) {
      // Check in-memory cache first (instant, 0ms)
      const mem = memoryCache[cacheKey];
      if (mem && Date.now() - mem.timestamp < MEMORY_CACHE_TTL) {
        return NextResponse.json(mem.data, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            "X-Cache": "HIT-MEMORY",
          },
        });
      }

      // Check Redis
      const cached = await getCachedData<DashboardData>(cacheKey);
      if (cached) {
        memoryCache[cacheKey] = { data: cached, timestamp: Date.now() };
        return NextResponse.json(cached, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            "X-Cache": "HIT-REDIS",
          },
        });
      }
    }

    // 2. Fetch fresh data (with deduplication for simultaneous calls)
    const inFlightKey = `${cacheKey}_${refreshTarget || "none"}`;
    let fetchPromise = inFlightRequests.get(inFlightKey);

    if (!fetchPromise) {
      fetchPromise = fetchDashboardData(request.signal, basic, refreshTarget);
      inFlightRequests.set(inFlightKey, fetchPromise);
    }

    let data: DashboardData;
    try {
      data = await fetchPromise;
    } finally {
      inFlightRequests.delete(inFlightKey);
    }

    // 3. Update both in-memory and Redis caches
    memoryCache[cacheKey] = { data, timestamp: Date.now() };
    await setCachedData(cacheKey, data, 120);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Request aborted" }, { status: 499 });
    }
    console.error("Dashboard API Error:", error);

    // If an error occurred but we have stale in-memory cache, return stale instead of failing!
    const url = new URL(request.url);
    const basic = url.searchParams.get("basic") === "true";
    const cacheKey = `dashboard_data_basic_${basic}`;
    const stale = memoryCache[cacheKey];
    if (stale) {
      console.warn("Serving stale dashboard memory cache due to fetch error");
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          "X-Cache": "STALE",
        },
      });
    }

    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
