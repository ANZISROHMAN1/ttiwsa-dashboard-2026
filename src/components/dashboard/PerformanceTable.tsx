"use client";

import { useState, useMemo } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DataTable } from "@/components/ui/DataTable";
import { AchievementBadge } from "@/components/ui/Badge";
import { formatPercent } from "@/lib/utils";
import { PERF_METRIC_TABS } from "@/lib/constants";
import type {
  RankingSA,
  RankingSTO,
  Segment,
  PerformanceMetricTab,
  DashboardSummary,
  KPISimulation,
  Ticket,
} from "@/types/dashboard";
import { DipisahView } from "./DipisahView";

interface PerformanceTableProps {
  summary: DashboardSummary;
  rankingSA: RankingSA[];
  rankingSTO: RankingSTO[];
  branchBogor: KPISimulation[];
  branchBogorIncludeBanten: KPISimulation[];
  ttiTickets: Ticket[];
  ffgTickets: Ticket[];
}

const SEGMENT_OPTIONS: { value: Segment; label: string }[] = [
  { value: "indihome", label: "Indihome" },
  { value: "indibiz", label: "Indibiz" },
];

const VIEW_OPTIONS: { value: "sa" | "sto"; label: string }[] = [
  { value: "sa", label: "Service Area" },
  { value: "sto", label: "STO" },
];

/** Rank number with medal styling */
function RankCell({ rank }: { rank: number }) {
  const medals = ["🥇", "🥈", "🥉"];
  if (rank <= 3) {
    return (
      <span className="text-base" title={`Rank #${rank}`}>
        {medals[rank - 1]}
      </span>
    );
  }
  return (
    <span className="text-foreground-muted font-mono text-xs">#{rank}</span>
  );
}

/** Get the sort key for a metric tab + segment combination */
function getSortKey(
  metric: PerformanceMetricTab,
  segment: Segment
): string {
  if (metric === "overall") return "achievement";
  if (metric === "tti") return segment === "indihome" ? "ttiIH" : "ttiIB";
  if (metric === "ttr-ffg") return segment === "indihome" ? "ffgIH" : "ffgIB";
  // ffg (garansi)
  return segment === "indihome" ? "garansiIH" : "garansiIB";
}

/** Get display label for current metric + segment */
function getMetricTitle(
  metric: PerformanceMetricTab,
  segment: Segment
): string {
  if (metric === "overall") return "Overall Achievement";
  if (metric === "tti")
    return segment === "indihome" ? "TTI 3x24 Indihome" : "TTI 1x24 Indibiz";
  if (metric === "ttr-ffg")
    return segment === "indihome"
      ? "TTR FFG Indihome"
      : "TTR FFG Indibiz";
  return segment === "indihome" ? "FFG Indihome (Garansi)" : "FFG Indibiz (Garansi)";
}

export function PerformanceTable({
  summary,
  rankingSA,
  rankingSTO,
  branchBogor,
  branchBogorIncludeBanten,
  ttiTickets,
  ffgTickets,
}: PerformanceTableProps) {
  const [metricTab, setMetricTab] = useState<PerformanceMetricTab>("overall");
  const [segment, setSegment] = useState<Segment>("indihome");
  const [view, setView] = useState<"sa" | "sto">("sa");

  const sortKey = getSortKey(metricTab, segment);

  // Sort data by the selected metric
  const sortedSA = useMemo(() => {
    return [...rankingSA].sort(
      (a, b) =>
        (b[sortKey as keyof RankingSA] as number) -
        (a[sortKey as keyof RankingSA] as number)
    );
  }, [rankingSA, sortKey]);

  const sortedSTO = useMemo(() => {
    return [...rankingSTO].sort(
      (a, b) =>
        (b[sortKey as keyof RankingSTO] as number) -
        (a[sortKey as keyof RankingSTO] as number)
    );
  }, [rankingSTO, sortKey]);

  // ── Build columns based on metric tab ──

  function buildSAColumns() {
    const base = [
      {
        key: "_rank",
        label: "#",
        align: "center" as const,
        render: (_row: RankingSA, index: number) => (
          <RankCell rank={index + 1} />
        ),
      },
      {
        key: "sa",
        label: "Service Area",
        sortable: true,
        render: (row: RankingSA) => (
          <span className="font-medium text-foreground">{row.sa}</span>
        ),
      },
    ];

    if (metricTab === "overall") {
      // Show the overall + all 3 metrics for selected segment
      return [
        ...base,
        {
          key: "achievement",
          label: "Overall",
          sortable: true,
          align: "center" as const,
          render: (row: RankingSA) => (
            <AchievementBadge value={row.achievement} />
          ),
        },
        ...(segment === "indihome"
          ? [
              col("ttiIH", "TTI"),
              col("ffgIH", "TTR FFG"),
              col("garansiIH", "FFG"),
            ]
          : [
              col("ttiIB", "TTI"),
              col("ffgIB", "TTR FFG"),
              col("garansiIB", "FFG"),
            ]),
      ];
    }

    // Single metric view — show just that metric as the primary + overall for context
    const metricKey = sortKey as keyof RankingSA;
    return [
      ...base,
      {
        key: metricKey,
        label: getMetricTitle(metricTab, segment),
        sortable: true,
        align: "center" as const,
        render: (row: RankingSA) => (
          <AchievementBadge value={row[metricKey] as number} />
        ),
      },
      {
        key: "achievement",
        label: "Overall",
        sortable: true,
        align: "center" as const,
        render: (row: RankingSA) => (
          <span className="font-mono text-sm text-foreground-muted">
            {formatPercent(row.achievement)}
          </span>
        ),
      },
      // Show the progress bar
      {
        key: "_bar",
        label: "Progress",
        align: "left" as const,
        render: (row: RankingSA) => {
          const val = row[metricKey] as number;
          return <ProgressBar value={val} />;
        },
      },
    ];
  }

  function buildSTOColumns() {
    const base = [
      {
        key: "_rank",
        label: "#",
        align: "center" as const,
        render: (_row: RankingSTO, index: number) => (
          <RankCell rank={index + 1} />
        ),
      },
      {
        key: "sto",
        label: "STO",
        sortable: true,
        render: (row: RankingSTO) => (
          <span className="font-medium text-foreground">{row.sto}</span>
        ),
      },
    ];

    if (metricTab === "overall") {
      return [
        ...base,
        {
          key: "achievement",
          label: "Overall",
          sortable: true,
          align: "center" as const,
          render: (row: RankingSTO) => (
            <AchievementBadge value={row.achievement} />
          ),
        },
        ...(segment === "indihome"
          ? [
              colSTO("ttiIH", "TTI"),
              colSTO("ffgIH", "TTR FFG"),
              colSTO("garansiIH", "FFG"),
            ]
          : [
              colSTO("ttiIB", "TTI"),
              colSTO("ffgIB", "TTR FFG"),
              colSTO("garansiIB", "FFG"),
            ]),
      ];
    }

    const metricKey = sortKey as keyof RankingSTO;
    return [
      ...base,
      {
        key: metricKey,
        label: getMetricTitle(metricTab, segment),
        sortable: true,
        align: "center" as const,
        render: (row: RankingSTO) => (
          <AchievementBadge value={row[metricKey] as number} />
        ),
      },
      {
        key: "achievement",
        label: "Overall",
        sortable: true,
        align: "center" as const,
        render: (row: RankingSTO) => (
          <span className="font-mono text-sm text-foreground-muted">
            {formatPercent(row.achievement)}
          </span>
        ),
      },
      {
        key: "_bar",
        label: "Progress",
        align: "left" as const,
        render: (row: RankingSTO) => {
          const val = row[metricKey] as number;
          return <ProgressBar value={val} />;
        },
      },
    ];
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Metric Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {PERF_METRIC_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMetricTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                metricTab === tab.value
                  ? "bg-accent-blue text-white shadow-lg shadow-blue-500/20"
                  : "bg-[var(--surface)] text-foreground-muted hover:text-foreground hover:bg-[var(--surface-hover)] border border-[var(--border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      {/* Segment + View Controls (Hide if dipisah) */}
      {metricTab !== "dipisah" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <SegmentedControl
            segments={SEGMENT_OPTIONS}
            value={segment}
            onChange={setSegment}
          />
          <SegmentedControl
            segments={VIEW_OPTIONS}
            value={view}
            onChange={setView}
          />
          <div className="text-xs text-foreground-muted ml-auto hidden sm:block">
            Ranked by: <span className="text-foreground font-medium">{getMetricTitle(metricTab, segment)}</span>
          </div>
        </div>
      )}
      </div>

      {/* Table or Dipisah View */}
      {metricTab === "dipisah" ? (
        <DipisahView
          summary={summary}
          rankingSA={rankingSA}
          branchBogor={branchBogor}
          branchBogorIncludeBanten={branchBogorIncludeBanten}
          ttiTickets={ttiTickets}
          ffgTickets={ffgTickets}
        />
      ) : view === "sa" ? (
        <DataTable
          columns={buildSAColumns()}
          data={sortedSA}
          keyExtractor={(row) => row.sa}
        />
      ) : (
        <DataTable
          columns={buildSTOColumns()}
          data={sortedSTO}
          keyExtractor={(row) => row.sto}
        />
      )}
    </div>
  );
}

// ── Helper components ──

function ProgressBar({ value }: { value: number }) {
  const clampedVal = Math.min(Math.max(value, 0), 100);
  const color =
    clampedVal >= 90
      ? "bg-emerald-400"
      : clampedVal >= 80
      ? "bg-amber-400"
      : "bg-rose-400";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="bar-track flex-1">
        <div
          className={`bar-fill ${color}`}
          style={{ width: `${clampedVal}%` }}
        />
      </div>
      <span className="text-xs font-mono text-foreground-muted w-12 text-right">
        {formatPercent(clampedVal)}
      </span>
    </div>
  );
}

/** Column builder helper for SA */
function col(key: keyof RankingSA, label: string) {
  return {
    key,
    label,
    sortable: true,
    align: "center" as const,
    render: (row: RankingSA) => (
      <span className="font-mono text-sm">
        {formatPercent(row[key] as number)}
      </span>
    ),
  };
}

/** Column builder helper for STO */
function colSTO(key: keyof RankingSTO, label: string) {
  return {
    key,
    label,
    sortable: true,
    align: "center" as const,
    render: (row: RankingSTO) => (
      <span className="font-mono text-sm">
        {formatPercent(row[key] as number)}
      </span>
    ),
  };
}
