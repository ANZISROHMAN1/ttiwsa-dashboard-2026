"use client";

import { usePerformanceEastern } from "@/hooks/usePerformanceEastern";
import { PerformanceEasternView } from "@/components/dashboard/PerformanceEasternView";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { RefreshCw } from "lucide-react";

function ErrorState({ error, refetch }: { error: string; refetch: () => void }) {
  return (
    <div className="glass-card p-8 text-center animate-fade-in mt-6">
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
      <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Performance Eastern Data</h3>
      <p className="text-sm text-foreground-muted mb-4 max-w-md mx-auto">{error}</p>
      <button onClick={refetch} className="btn-primary inline-flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card p-8 text-center animate-fade-in mt-6">
      <h3 className="text-lg font-semibold text-foreground mb-2">No Performance Data Available</h3>
      <p className="text-sm text-foreground-muted">Google Sheet tidak mengembalikan data indikator.</p>
    </div>
  );
}

export default function PerformanceEasternPage() {
  const { data, isLoading, error, refetch } = usePerformanceEastern();

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} refetch={refetch} />;
  if (!data || !data.indicators || data.indicators.length === 0) return <EmptyState />;

  return <PerformanceEasternView data={data} />;
}

