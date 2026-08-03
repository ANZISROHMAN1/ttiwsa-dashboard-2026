"use client";

import { useState } from "react";
import { useReportIHEastern } from "@/hooks/useReportIHEastern";
import { useReportAllEastern } from "@/hooks/useReportAllEastern";
import { useReportEbis } from "@/hooks/useReportEbis";
import { useReportDatin } from "@/hooks/useReportDatin";
import { useReportIHTrend } from "@/hooks/useReportIHTrend";
import { useReportEbisTrend } from "@/hooks/useReportEbisTrend";
import { useReportEbisAssurance } from "@/hooks/useReportEbisAssurance";
import { ReportIHEastern } from "@/components/dashboard/ReportIHEastern";
import { ReportEbisEastern } from "@/components/dashboard/ReportEbisEastern";
import { ReportDatinEastern } from "@/components/dashboard/ReportDatinEastern";
import { FrameworkDataTable } from "@/components/dashboard/FrameworkDataTable";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { FrameworkCategory } from "@/types/report-all-eastern";

const CATEGORIES: FrameworkCategory[] = ["WSA", "CNOP", "EBIS", "OLO", "NETWORK"];

function ErrorState({ error, refetch }: { error: string; refetch: () => void }) {
  return (
    <div className="glass-card p-8 text-center animate-fade-in mt-6">
      <div className="w-12 h-12 rounded-full bg-rose-400/10 flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Data</h3>
      <p className="text-sm text-foreground-muted mb-4 max-w-md mx-auto">{error}</p>
      <button onClick={refetch} className="btn-primary">Try Again</button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card p-8 text-center animate-fade-in mt-6">
      <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
      <p className="text-sm text-foreground-muted">The report endpoint returned no data.</p>
    </div>
  );
}

function WsaView() {
  const { data, isLoading, error, refetch } = useReportIHEastern();
  const { data: trendData } = useReportIHTrend();

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} refetch={refetch} />;
  if (!data || data.length === 0) return <EmptyState />;

  return <ReportIHEastern data={data} trendData={trendData} />;
}

function EbisView() {
  const { data: ffData, isLoading: isFfLoading, error: ffError, refetch: refetchFf } = useReportEbis();
  const { data: assuranceData, isLoading: isAssuranceLoading } = useReportEbisAssurance();
  const { data: trendData } = useReportEbisTrend();

  if (isFfLoading && isAssuranceLoading) return <PageSkeleton />;
  if (ffError) return <ErrorState error={ffError} refetch={refetchFf} />;
  if ((!ffData || ffData.length === 0) && (!assuranceData || assuranceData.length === 0)) return <EmptyState />;

  return <ReportEbisEastern data={ffData || []} assuranceData={assuranceData} trendData={trendData} />;
}

function DatinView() {
  const { data, isLoading, error, refetch } = useReportDatin();

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} refetch={refetch} />;
  if (!data || data.length === 0) return <EmptyState />;

  return <ReportDatinEastern data={data} />;
}

function FrameworkView({ category }: { category: FrameworkCategory }) {
  const { data, isLoading, error, refetch } = useReportAllEastern();

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} refetch={refetch} />;
  if (!data || data.length === 0) return <EmptyState />;

  return <FrameworkDataTable data={data} category={category} />;
}

export default function ReportIHEasternPage() {
  const [activeCategory, setActiveCategory] = useState<FrameworkCategory>("WSA");

  return (
    <div className="space-y-6">
      {/* Sleek Category Filter */}
      <div className="glass-card p-1.5 flex gap-1.5 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-1 min-w-fit px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap",
              activeCategory === cat
                ? "bg-accent-blue text-white shadow-lg shadow-blue-500/20"
                : "text-foreground-muted hover:bg-[var(--surface-hover)] hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {activeCategory === "WSA" ? (
        <WsaView />
      ) : activeCategory === "EBIS" ? (
        <EbisView />
      ) : activeCategory === "OLO" ? (
        <DatinView />
      ) : (
        <FrameworkView category={activeCategory} />
      )}
    </div>
  );
}
