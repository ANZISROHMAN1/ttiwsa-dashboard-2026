import { NextResponse } from "next/server";
import { fetchDashboardData, ApiError } from "@/lib/api";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const data = await fetchDashboardData(request.signal);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Request aborted" }, { status: 499 });
    }
    console.error("Dashboard API Error:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
