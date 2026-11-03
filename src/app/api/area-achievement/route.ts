import { NextResponse } from "next/server";
import defaultData from "@/data/areaAchievementDefault.json";
import { getCachedData, setCachedData } from "@/lib/redisCache";
import type { AreaAchievementData } from "@/types/area-achievement";

export const dynamic = "force-dynamic";

let memoryCache: { data: AreaAchievementData; timestamp: number } | null = null;
const MEMORY_CACHE_TTL = 60 * 1000;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = "area_achievement_data";

    if (!refresh) {
      const cached = await getCachedData<AreaAchievementData>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      if (memoryCache && Date.now() - memoryCache.timestamp < MEMORY_CACHE_TTL) {
        return NextResponse.json(memoryCache.data);
      }
    }

    const data = defaultData as unknown as AreaAchievementData;
    memoryCache = { data, timestamp: Date.now() };
    await setCachedData(cacheKey, data, 60);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Area Achievement API Error:", error);
    return NextResponse.json(defaultData as unknown as AreaAchievementData);
  }
}

