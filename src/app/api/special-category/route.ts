import { NextResponse } from "next/server";
import defaultData from "@/data/specialCategoryDefault.json";
import { getCachedData, setCachedData } from "@/lib/redisCache";
import type { SpecialCategoryData } from "@/types/special-category";

export const dynamic = "force-dynamic";

let memoryCache: { data: SpecialCategoryData; timestamp: number } | null = null;
const MEMORY_CACHE_TTL = 60 * 1000;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = "special_category_data";

    if (!refresh) {
      // 1. Try Redis cache
      const cached = await getCachedData<SpecialCategoryData>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      // 2. Try In-memory cache
      if (memoryCache && Date.now() - memoryCache.timestamp < MEMORY_CACHE_TTL) {
        return NextResponse.json(memoryCache.data);
      }
    }

    // Default data from verified WISA snapshot
    const data = defaultData as unknown as SpecialCategoryData;

    // Cache
    memoryCache = { data, timestamp: Date.now() };
    await setCachedData(cacheKey, data, 60);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Special Category API Error:", error);
    return NextResponse.json(defaultData as unknown as SpecialCategoryData);
  }
}

