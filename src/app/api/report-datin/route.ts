import { NextResponse } from "next/server";
import { DATIN_API_URL } from "@/lib/constants";
import { getCachedData, setCachedData } from "@/lib/redisCache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh') === 'true';
    const cacheKey = "report_datin_data";

    if (!refresh) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        console.log("Returning cached report-datin data");
        return NextResponse.json(cached);
      }
    }

    if (!DATIN_API_URL) {
      return NextResponse.json(
        { error: "DATIN_API is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(DATIN_API_URL, {
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
    console.error("Report DATIN API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}
