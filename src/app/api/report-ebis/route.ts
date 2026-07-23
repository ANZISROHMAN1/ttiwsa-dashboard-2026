import { NextResponse } from "next/server";
import { EBIS_API_URL } from "@/lib/constants";
import { getCachedData, setCachedData } from "@/lib/redisCache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh') === 'true';
    const cacheKey = "report_ebis_data";

    if (!refresh) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        console.log("Returning cached report-ebis data");
        return NextResponse.json(cached);
      }
    }

    if (!EBIS_API_URL) {
      return NextResponse.json(
        { error: "EBIS_API is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(EBIS_API_URL, {
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
    const finalData = data.Data || data;
    await setCachedData(cacheKey, finalData, 60);
    return NextResponse.json(finalData);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Request aborted" }, { status: 499 });
    }
    console.error("Report EBIS API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}
