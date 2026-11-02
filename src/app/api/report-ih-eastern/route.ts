import { NextResponse } from "next/server";
import { REPORT_IH_EASTERN_API_URL } from "@/lib/constants";
import { getCachedData, setCachedData } from "@/lib/redisCache";

export const dynamic = "force-dynamic";

let memoryCache: { data: any; timestamp: number } | null = null;
const MEMORY_CACHE_TTL = 120 * 1000;
let inFlightPromise: Promise<any> | null = null;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = "report_ih_eastern_data";

    if (!refresh) {
      // 1. Check in-memory cache
      if (memoryCache && Date.now() - memoryCache.timestamp < MEMORY_CACHE_TTL) {
        return NextResponse.json(memoryCache.data, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            "X-Cache": "HIT-MEMORY",
          },
        });
      }

      // 2. Check Redis
      const cached = await getCachedData(cacheKey);
      if (cached) {
        memoryCache = { data: cached, timestamp: Date.now() };
        return NextResponse.json(cached, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            "X-Cache": "HIT-REDIS",
          },
        });
      }
    }

    if (!REPORT_IH_EASTERN_API_URL) {
      return NextResponse.json(
        { error: "API_BARU_REPORT_IH_EASTERN is not configured" },
        { status: 500 }
      );
    }

    // In-flight deduplication
    if (!inFlightPromise) {
      inFlightPromise = (async () => {
        const response = await fetch(REPORT_IH_EASTERN_API_URL, {
          signal: request.signal,
          next: { revalidate: 0 },
        });

        if (!response.ok) {
          throw new Error(`Upstream API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
      })();
    }

    let data: any;
    try {
      data = await inFlightPromise;
    } finally {
      inFlightPromise = null;
    }

    memoryCache = { data, timestamp: Date.now() };
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
    console.error("Report IH Eastern API Error:", error);

    // Stale fallback
    if (memoryCache) {
      return NextResponse.json(memoryCache.data, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          "X-Cache": "STALE",
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}
