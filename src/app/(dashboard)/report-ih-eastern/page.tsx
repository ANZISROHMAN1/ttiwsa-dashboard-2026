"use client";

import { useReportIHEastern } from "@/hooks/useReportIHEastern";
import { ReportIHEastern } from "@/components/dashboard/ReportIHEastern";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function ReportIHEasternPage() {
  const { data, isLoading, error, refetch } = useReportIHEastern();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
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
          Failed to Load Report
        </h3>
        <p className="text-sm text-foreground-muted mb-4 max-w-md mx-auto">
          {error}
        </p>
        <button onClick={refetch} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Data Available
        </h3>
        <p className="text-sm text-foreground-muted">
          The report endpoint returned no districts.
        </p>
      </div>
    );
  }

  return <ReportIHEastern data={data} />;
}
