"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/types/dashboard";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div
      className={cn(
        "glass-card overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    col.sortable && "sortable",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right"
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                        className={cn(
                          "transition-transform",
                          sortDir === "asc" && "rotate-180"
                        )}
                      >
                        <path d="M6 8L2 4h8L6 8z" />
                      </svg>
                    )}
                    {col.sortable && sortKey !== col.key && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                        className="opacity-30"
                      >
                        <path d="M6 2l4 3H2l4-3zm0 8L2 7h8l-4 3z" />
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-foreground-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr key={keyExtractor(row, index)}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right"
                      )}
                    >
                      {col.render
                        ? col.render(row, index)
                        : String(
                            (row as Record<string, unknown>)[col.key] ?? "—"
                          )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
