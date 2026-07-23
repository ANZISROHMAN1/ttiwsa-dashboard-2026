import { NextResponse } from "next/server";
import { fetchDashboardData, ApiError } from "@/lib/api";
import { getCachedData, setCachedData } from "@/lib/redisCache";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const basic = url.searchParams.get('basic') === 'true';
    const refresh = url.searchParams.get('refresh') === 'true';
    
    const cacheKey = `dashboard_data_basic_${basic}`;
    
    if (!refresh) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        console.log(`Returning cached dashboard data for basic=${basic}`);
        return NextResponse.json(cached);
      }
    }
    
    const data = await fetchDashboardData(request.signal, basic);
    console.log(`Dashboard data fetched (basic: ${basic}). UPDATED tickets count:`, data.ttiTickets.filter(t => t.kpi === 'UPDATED').length);
    
    await setCachedData(cacheKey, data, 60); // Cache for 60 seconds
    
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
