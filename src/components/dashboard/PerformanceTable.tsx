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
  SaldoPspiTicket,
} from "@/types/dashboard";
import { DipisahView } from "./DipisahView";
import { SaldoPspiView } from "./SaldoPspiView";
import { UnspecView } from "./UnspecView";
import type { UnspecTicket } from "@/types/dashboard";
import { useReportIHEastern } from "@/hooks/useReportIHEastern";

interface PerformanceTableProps {
  summary: DashboardSummary;
  rankingSA: RankingSA[];
  rankingSTO: RankingSTO[];
  branchBogor: KPISimulation[];
  branchBogorIncludeBanten: KPISimulation[];
  ttiTickets: Ticket[];
  ffgTickets: Ticket[];
  saldoPspiTickets: SaldoPspiTicket[];
  unspecTickets: UnspecTicket[];
  mode?: "leaderboard" | "performance";
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
  segment: Segment,
  mode: "leaderboard" | "performance"
): string {
  if (metric === "overall") {
    if (mode === "leaderboard") return segment === "indihome" ? "achievementIH" : "achievementIB";
    return segment === "indihome" ? "performanceIH" : "performanceIB";
  }
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
  saldoPspiTickets,
  unspecTickets,
  mode = "performance",
}: PerformanceTableProps) {
  const [metricTab, setMetricTab] = useState<PerformanceMetricTab>("overall");
  const [segment, setSegment] = useState<Segment>("indihome");
  const [view, setView] = useState<"sa" | "sto">("sa");
  const [districtFilter, setDistrictFilter] = useState<string>("ALL");

  const { data: districtData } = useReportIHEastern();

  const { getDistrictForSA, getDistrictForSTO, districts } = useMemo(() => {
    const s2d: Record<string, string> = {};
    const sto2d: Record<string, string> = {};
    const dists = new Set<string>();

    if (districtData) {
      districtData.forEach(d => {
        dists.add(d.district);
        d.serviceAreas?.forEach(sa => {
          s2d[sa.serviceArea.toUpperCase()] = d.district;
          sa.stos?.forEach(sto => {
            sto2d[sto.sto.toUpperCase()] = d.district;
          });
        });
      });
    }

    // Helper for fuzzy matching since API strings differ (e.g. "CIAPUS - PAGELARAN" vs "PAGELARAN")
    const getDistrictForSA = (saName: string) => {
      const upper = saName.toUpperCase();
      if (s2d[upper]) return s2d[upper];
      for (const [knownSA, dist] of Object.entries(s2d)) {
        // If the known SA is a substring of the raw SA or vice-versa
        if (upper.includes(knownSA) || knownSA.includes(upper)) {
          return dist;
        }
      }
      return "UNKNOWN";
    };

    const getDistrictForSTO = (stoName: string) => {
      const upper = stoName.toUpperCase();
      if (sto2d[upper]) return sto2d[upper];
      for (const [knownSTO, dist] of Object.entries(sto2d)) {
        if (upper.includes(knownSTO) || knownSTO.includes(upper)) {
          return dist;
        }
      }
      return "UNKNOWN";
    };

    return { getDistrictForSA, getDistrictForSTO, districts: Array.from(dists).sort() };
  }, [districtData]);

  const sortKey = getSortKey(metricTab, segment, mode);

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

  // Enrich data with PS/PI and UNSPEC counts, and apply District Filter
  const enrichedSortedSA = useMemo(() => {
    return sortedSA
      .filter(row => districtFilter === "ALL" || getDistrictForSA(row.sa) === districtFilter)
      .map(row => {
        const pspi = saldoPspiTickets.filter(t => t.SA?.toUpperCase() === row.sa?.toUpperCase()).length;
        const unspec = unspecTickets.filter(t => t.SA?.toUpperCase() === row.sa?.toUpperCase()).length;
        return { ...row, _pspi: pspi, _unspec: unspec };
      });
  }, [sortedSA, saldoPspiTickets, unspecTickets, districtFilter, getDistrictForSA]);

  const enrichedSortedSTO = useMemo(() => {
    return sortedSTO
      .filter(row => districtFilter === "ALL" || getDistrictForSTO(row.sto) === districtFilter)
      .map(row => {
        const pspi = saldoPspiTickets.filter(t => t.sto?.toUpperCase() === row.sto?.toUpperCase()).length;
        const unspec = unspecTickets.filter(t => t.sto?.toUpperCase() === row.sto?.toUpperCase()).length;
        return { ...row, _pspi: pspi, _unspec: unspec };
      });
  }, [sortedSTO, saldoPspiTickets, unspecTickets, districtFilter, getDistrictForSTO]);

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
          render: (row: any) => {
            const val = mode === "leaderboard" 
              ? (segment === "indihome" ? row.achievementIH : row.achievementIB)
              : (segment === "indihome" ? row.performanceIH : row.performanceIB);
            return <AchievementBadge value={val} />;
          },
        },
        ...(segment === "indihome"
          ? mode === "leaderboard"
            ? [
                col("saIH", "SA"),
                col("asgarIH", "ASGAR"),
                col("diamondIH", "DIAMOND"),
                col("platinumIH", "PLATINUM"),
                col("manjaIH", "MANJA"),
                col("ttr36IH", "TTR 36"),
                col("ttiIH", "TTI 3X24"),
                col("garansiIH", "FFG"),
                col("ffgIH", "TTR FFG"),
              ]
            : [
                col("ttiIH", "TTI"),
                col("ffgIH", "TTR FFG"),
                col("garansiIH", "FFG"),
              ]
          : mode === "leaderboard"
            ? [
                col("ttiIB", "TTI 1X24"),
                col("ffgIB", "TTR FFG"),
                col("garansiIB", "FFG"),
                col("underspecIB", "UNDERSPEC"),
                col("pspiIB", "PS/PI RATIO"),
              ]
            : [
                col("ttiIB", "TTI"),
                col("ffgIB", "TTR FFG"),
                col("garansiIB", "FFG"),
                {
                  key: "_pspi",
                  label: "PS/PI",
                  sortable: true,
                  align: "center" as const,
                  render: (row: any) => (
                    <span className="font-mono text-sm">{row._pspi}</span>
                  )
                },
                {
                  key: "_unspec",
                  label: "UNSPEC",
                  sortable: true,
                  align: "center" as const,
                  render: (row: any) => (
                    <span className="font-mono text-sm">{row._unspec}</span>
                  )
                },
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
          render: (row: RankingSTO) => {
            const val = mode === "leaderboard" 
              ? (segment === "indihome" ? row.achievementIH : row.achievementIB)
              : (segment === "indihome" ? row.performanceIH : row.performanceIB);
            return <AchievementBadge value={val} />;
          },
        },
        ...(segment === "indihome"
          ? mode === "leaderboard"
            ? [
                colSTO("saIH", "SA"),
                colSTO("asgarIH", "ASGAR"),
                colSTO("diamondIH", "DIAMOND"),
                colSTO("platinumIH", "PLATINUM"),
                colSTO("manjaIH", "MANJA"),
                colSTO("ttr36IH", "TTR 36"),
                colSTO("ttiIH", "TTI 3X24"),
                colSTO("garansiIH", "FFG"),
                colSTO("ffgIH", "TTR FFG"),
              ]
            : [
                colSTO("ttiIH", "TTI"),
                colSTO("ffgIH", "TTR FFG"),
                colSTO("garansiIH", "FFG"),
              ]
          : mode === "leaderboard"
            ? [
                colSTO("ttiIB", "TTI 1X24"),
                colSTO("ffgIB", "TTR FFG"),
                colSTO("garansiIB", "FFG"),
                colSTO("underspecIB", "UNDERSPEC"),
                colSTO("pspiIB", "PS/PI RATIO"),
              ]
            : [
                colSTO("ttiIB", "TTI"),
                colSTO("ffgIB", "TTR FFG"),
                colSTO("garansiIB", "FFG"),
                {
                  key: "_pspi",
                  label: "PS/PI",
                  sortable: true,
                  align: "center" as const,
                  render: (row: any) => (
                    <span className="font-mono text-sm">{row._pspi}</span>
                  )
                },
                {
                  key: "_unspec",
                  label: "UNSPEC",
                  sortable: true,
                  align: "center" as const,
                  render: (row: any) => (
                    <span className="font-mono text-sm">{row._unspec}</span>
                  )
                },
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
    <div className="space-y-5 animate-fade-in relative">
      {/* Sticky Header for Controls */}
      <div className="sticky top-[var(--header-height)] z-20 bg-[var(--background)]/95 backdrop-blur-xl pt-5 lg:pt-8 pb-4 -mx-5 px-5 lg:-mx-8 lg:px-8 border-b border-[var(--border)] mb-6 flex flex-col gap-4 -mt-5 lg:-mt-8">
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

      {/* Segment + View Controls (Hide if saldo-pspi or unspec) */}
      {metricTab !== "saldo-pspi" && metricTab !== "unspec" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <SegmentedControl
            segments={SEGMENT_OPTIONS}
            value={segment}
            onChange={setSegment}
          />
          {metricTab !== "dipisah" && (
            <>
              <SegmentedControl
                segments={VIEW_OPTIONS}
                value={view}
                onChange={setView}
              />
              <div className="flex items-center">
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="bg-[var(--surface)] text-foreground text-sm font-semibold border border-[var(--border)] rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 min-h-[38px]"
                >
                  <option value="ALL">All Districts</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-foreground-muted ml-auto hidden sm:block">
                Ranked by: <span className="text-foreground font-medium">{getMetricTitle(metricTab, segment)}</span>
              </div>
            </>
          )}
        </div>
      )}
      </div>

      {/* Table, Dipisah View, SaldoPspiView, or UnspecView */}
      {metricTab === "unspec" ? (
        <UnspecView tickets={unspecTickets} allSAs={rankingSA.map((r) => r.sa)} allSTOs={rankingSTO.map((r) => r.sto)} />
      ) : metricTab === "saldo-pspi" ? (
        <SaldoPspiView tickets={saldoPspiTickets} allSAs={rankingSA.map((r) => r.sa)} />
      ) : metricTab === "dipisah" ? (
        <DipisahView
          summary={summary}
          rankingSA={rankingSA}
          branchBogor={branchBogor}
          branchBogorIncludeBanten={branchBogorIncludeBanten}
          ttiTickets={ttiTickets}
          ffgTickets={ffgTickets}
          saldoPspiTickets={saldoPspiTickets}
          unspecTickets={unspecTickets}
          segment={segment}
        />
      ) : view === "sa" ? (
        <DataTable
          columns={buildSAColumns()}
          data={enrichedSortedSA}
          keyExtractor={(row) => row.sa}
        />
      ) : (
        <DataTable
          columns={buildSTOColumns()}
          data={enrichedSortedSTO}
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
