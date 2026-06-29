import { API_BASE_URL } from "./constants";
import type { DashboardData } from "@/types/dashboard";

// ─── API Error ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Fetch Dashboard Data ───────────────────────────────────────────────────

/**
 * Fetches the live KPI dashboard data from the Google Apps Script API.
 * Works in both server components (direct await) and client components (via hook).
 */
export async function fetchDashboardData(
  signal?: AbortSignal
): Promise<DashboardData> {
  try {
    const response = await fetch(API_BASE_URL, {
      signal,
      next: { revalidate: 0 }, // Always fetch fresh data
    });

    if (!response.ok) {
      throw new ApiError(
        `API returned ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    const data: DashboardData = await response.json();

    // Basic validation
    if (!data.summary || !data.rankingSA || !data.ttiTickets) {
      throw new ApiError("Invalid API response structure");
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // Re-throw abort errors
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch dashboard data"
    );
  }
}
