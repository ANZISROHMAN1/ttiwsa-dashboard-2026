"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="sidebar"
      className={cn(
        "fixed top-0 left-0 z-40 h-screen flex-col bg-[var(--background-secondary)] border-r border-[var(--border)] transition-all duration-300 ease-in-out hidden lg:flex",
        collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Logo / Brand */}
      <div className="h-[var(--header-height)] flex items-center px-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <span className="font-semibold text-sm text-foreground tracking-tight">
                TTIWSA
              </span>
              <span className="block text-[10px] text-foreground-muted leading-none mt-0.5">
                KPI Dashboard
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-accent-blue/10 text-accent-blue"
                  : "text-foreground-muted hover:bg-[var(--surface)] hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-blue rounded-r" />
              )}

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d={item.icon} />
              </svg>

              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          id="sidebar-toggle"
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-foreground-muted hover:bg-[var(--surface)] hover:text-foreground transition-all duration-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          >
            <path d="M11 17l-5-5 5-5" />
            <path d="M18 17l-5-5 5-5" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
