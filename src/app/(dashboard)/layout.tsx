"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

// Create a context so child pages can access dashboard data
import { createContext, useContext } from "react";
import type { DashboardData } from "@/types/dashboard";

interface DashboardContextValue {
  data: DashboardData | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

export const DashboardContext = createContext<DashboardContextValue>({
  data: null,
  isLoading: true,
  isRefetching: false,
  error: null,
  lastUpdated: null,
  refetch: () => {},
});

export function useDashboard() {
  return useContext(DashboardContext);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const dashboardData = useDashboardData();

  const handleMenuToggle = useCallback(() => {
    setMobileNavOpen((prev) => !prev);
  }, []);

  const handleMobileNavClose = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const handleGlobalRefresh = useCallback(() => {
    // 1. Refetch the main dashboard data
    dashboardData.refetch();
    // 2. Dispatch a global event so other pages (like Kawal 65 PI) can listen and refetch their own hooks
    window.dispatchEvent(new CustomEvent('global-refresh'));
  }, [dashboardData]);

  const sidebarWidth = isDesktop
    ? sidebarCollapsed
      ? "var(--sidebar-collapsed-width)"
      : "var(--sidebar-width)"
    : "0px";

  return (
    <DashboardContext value={dashboardData}>
      {/* Sidebar (desktop only) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Mobile Nav */}
      <MobileNav isOpen={mobileNavOpen} onClose={handleMobileNavClose} />

      {/* Main Content */}
      <div
        className={cn("min-h-screen transition-all duration-300")}
        style={{ marginLeft: sidebarWidth }}
      >
        <Header
          lastUpdated={dashboardData.lastUpdated}
          isLoading={dashboardData.isLoading || dashboardData.isRefetching}
          onRefresh={handleGlobalRefresh}
          onMenuToggle={handleMenuToggle}
        />

        <main className="p-5 lg:p-8">
          {/* Global Error State */}
          {dashboardData.error && !dashboardData.data && (
            <div className="glass-card p-8 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-rose-400/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-rose-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Failed to Load Data
              </h3>
              <p className="text-sm text-foreground-muted mb-4 max-w-md mx-auto">
                {dashboardData.error}
              </p>
              <button
                onClick={dashboardData.refetch}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Page Content */}
          {(!dashboardData.error || dashboardData.data) && children}
        </main>
      </div>
    </DashboardContext>
  );
}
