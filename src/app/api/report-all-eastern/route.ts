import { NextResponse } from "next/server";
import { REPORT_ALL_EASTERN_API_URL } from "@/lib/constants";
import { getCachedData, setCachedData } from "@/lib/redisCache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh') === 'true';
    const cacheKey = "report_all_eastern_data";

    if (!refresh) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        console.log("Returning cached report-all-eastern data");
        return NextResponse.json(cached);
      }
    }

    if (!REPORT_ALL_EASTERN_API_URL) {
      return NextResponse.json(
        { error: "API_BARU_REPORT_ALL_EASTERN is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(REPORT_ALL_EASTERN_API_URL, {
      signal: request.signal,
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    await setCachedData(cacheKey, data, 60);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Request aborted" }, { status: 499 });
    }
    console.error("Report All Eastern API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch framework data" },
      { status: 500 }
    );
  }
}
