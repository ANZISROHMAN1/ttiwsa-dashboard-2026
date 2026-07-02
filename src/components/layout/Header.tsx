"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { formatTimestamp } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { LoginButton } from "@/components/layout/LoginButton";

interface HeaderProps {
  lastUpdated: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
  onMenuToggle: () => void;
}

export function Header({
  lastUpdated,
  isLoading,
  onRefresh,
  onMenuToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Find current page title
  const currentNav = NAV_ITEMS.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(item.href))
  );
  const pageTitle = currentNav?.label || "Overview";
  const pageDescription = currentNav?.description || "Dashboard summary";

  return (
    <header
      id="main-header"
      className="h-[var(--header-height)] sticky top-0 z-30 flex items-center justify-between px-5 lg:px-8 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]"
    >
      {/* Left: Mobile menu + Page title */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          id="mobile-menu-toggle"
          onClick={onMenuToggle}
          className="btn-icon lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-xs text-foreground-muted hidden sm:block">
            {pageDescription}
          </p>
        </div>
      </div>

      {/* Right: Last updated + Refresh */}
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-foreground-muted">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Updated {formatTimestamp(lastUpdated)}</span>
          </div>
        )}

        <button
          id="refresh-button"
          onClick={onRefresh}
          disabled={isLoading}
          className="btn-secondary !py-2 !px-3 text-xs"
          aria-label="Refresh data"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isLoading ? "animate-spin" : ""}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === "light" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>

        <LoginButton />
      </div>
    </header>
  );
}
