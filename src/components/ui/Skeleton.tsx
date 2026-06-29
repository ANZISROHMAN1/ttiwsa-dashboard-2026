"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded-md",
        variant === "rectangular" && "rounded-xl",
        className
      )}
      style={{ width, height }}
    />
  );
}

/** Skeleton that mimics a metric card */
export function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8" variant="circular" />
      </div>
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/** Skeleton for a data table */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-[var(--border)]">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full page loading skeleton */
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton />
    </div>
  );
}
