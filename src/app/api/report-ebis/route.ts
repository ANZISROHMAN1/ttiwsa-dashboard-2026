import { NextResponse } from "next/server";
import { EBIS_API_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
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
    return NextResponse.json(data.Data || data);
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
