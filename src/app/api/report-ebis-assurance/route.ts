import { NextResponse } from "next/server";
import { REPORT_EBIS_ASSURANCE_API_URL } from "@/lib/constants";
import { getCachedData, setCachedData } from "@/lib/redisCache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "true";
    const cacheKey = "report_ebis_assurance_data";

    if (!refresh) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        console.log("Returning cached report-ebis-assurance data");
        return NextResponse.json(cached);
      }
    }

    if (!REPORT_EBIS_ASSURANCE_API_URL) {
      return NextResponse.json(
        { error: "API_ASS_EBIS is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(REPORT_EBIS_ASSURANCE_API_URL, {
      signal: request.signal,
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${response.status}` },
        { status: response.status }
      );
    }

    const json = await response.json();
    const data = json.Data || json;

    await setCachedData(cacheKey, data, 60);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Request aborted" }, { status: 499 });
    }
    console.error("Report EBIS Assurance API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assurance data" },
      { status: 500 }
    );
  }
}
