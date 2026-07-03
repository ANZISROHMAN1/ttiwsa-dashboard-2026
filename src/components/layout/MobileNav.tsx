"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
          style={{ animationDuration: "150ms" }}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-[280px] bg-[var(--background-secondary)] border-r border-[var(--border)] lg:hidden transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-[var(--header-height)] flex items-center justify-between px-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/testsayyid.jpg" 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-semibold text-sm text-foreground">
                TTIWSA
              </span>
              <span className="block text-[10px] text-foreground-muted leading-none mt-0.5">
                KPI Dashboard
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close menu"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent-blue/10 text-accent-blue"
                    : "text-foreground-muted hover:bg-[var(--surface)] hover:text-foreground"
                )}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                <div>
                  <span className="block">{item.label}</span>
                  <span className="block text-[11px] text-foreground-muted font-normal mt-0.5">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
