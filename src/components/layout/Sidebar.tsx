"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src="/testsayyid.jpg" 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
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
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isDropdownOpen = openDropdowns[item.label] || (hasSubItems && pathname.startsWith(item.href));

          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          const navContent = (
            <>
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
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!collapsed && hasSubItems && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn("shrink-0 transition-transform duration-200", isDropdownOpen ? "rotate-180" : "")}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg flex flex-col gap-1">
                  <span className="font-medium">{item.label}</span>
                  {hasSubItems && item.subItems!.map(sub => (
                    <span key={sub.href} className="text-xs text-foreground-muted border-t border-[var(--border)] pt-1 mt-1 block">
                      {sub.label}
                    </span>
                  ))}
                </div>
              )}
            </>
          );

          return (
            <div key={item.label} className="space-y-1">
              {hasSubItems ? (
                <button
                  onClick={() => toggleDropdown(item.label)}
                  id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                    isActive && !isDropdownOpen
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "text-foreground-muted hover:bg-[var(--surface)] hover:text-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {navContent}
                </button>
              ) : (
                <Link
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
                  {navContent}
                </Link>
              )}

              {!collapsed && hasSubItems && isDropdownOpen && (
                <div className="pl-10 pr-3 py-1 space-y-1 animate-fade-in">
                  {item.subItems!.map((subItem) => {
                    const isSubActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "block px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200",
                          isSubActive
                            ? "bg-accent-blue/10 text-accent-blue font-semibold"
                            : "text-foreground-muted hover:bg-[var(--surface)] hover:text-foreground"
                        )}
                      >
                        {subItem.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 text-center border-t border-[var(--border)] animate-fade-in">
          <div className="text-[10px] text-foreground-muted leading-relaxed font-medium">
            Dashboard made by Sayyid Faqih<br />
            <a href="mailto:faqihsayyid@gmail.com" className="hover:text-accent-blue transition-colors">faqihsayyid@gmail.com</a><br />
            Since 2026
          </div>
        </div>
      )}

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
