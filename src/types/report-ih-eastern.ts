// ─── Report IH Eastern Types ────────────────────────────────────────────────

export type TrendEmoji = "🔴" | "🟡" | "🟢";

/** Base metric shape shared by all KPI categories */
export interface MetricData {
  real: number;
  ach: number | string;
  h1: number;
  trend: TrendEmoji;
  // Optional fields that appear on some metrics
  tiketGgn?: number;
  lisPlngn?: number;
  gaul?: number;
  comply?: number;
  notComply?: number;
  thresholdNc?: number;
  dev?: number;
  jmlPs?: number;
  jmlGgnWsa?: number;
  // TTR FFG specific
  sa?: number | string;
  asgar?: number | string;
  diamond?: number | string;
  platinum?: number | string;
  manja?: number | string;
  tti?: number | string;
  ffg?: number | string;
  ttrFfg?: number | string;
  notAch?: number | string;
}

/** All 9 metric categories available on each STO / SA summary */
export interface MetricSet {
  serviceAvailability: MetricData;
  assuranceGuarantee: MetricData;
  ttrCompDiamond3Jam: MetricData;
  ttrCompPlatinum6Jam: MetricData;
  ttrCompManja3Jam: MetricData;
  ttr36Jam: MetricData;
  tti3x24Jam: MetricData;
  ffg: MetricData;
  ttrFfg: MetricData;
}

/** Level 3: Individual STO hub */
export interface STOData extends MetricSet {
  sto: string;
}

/** Level 2: Service Area with summary + child STOs */
export interface ServiceAreaData {
  serviceArea: string;
  summary: MetricSet;
  stos: STOData[];
}

/** Level 1: District with child Service Areas */
export interface DistrictData {
  district: string;
  serviceAreas: ServiceAreaData[];
}

/** The full API response is an array of districts */
export type ReportIHEasternResponse = DistrictData[];

// ─── Metric display config ──────────────────────────────────────────────────

export type MetricKey = keyof MetricSet;

export interface MetricConfig {
  key: MetricKey;
  label: string;
  shortLabel: string;
}

export const METRIC_CONFIGS: MetricConfig[] = [
  { key: "serviceAvailability", label: "Service Availability", shortLabel: "SA" },
  { key: "assuranceGuarantee", label: "Assurance Guarantee", shortLabel: "ASGAR" },
  { key: "ttrCompDiamond3Jam", label: "TTR Diamond 3h", shortLabel: "Diamond" },
  { key: "ttrCompPlatinum6Jam", label: "TTR Platinum 6h", shortLabel: "Platinum" },
  { key: "ttrCompManja3Jam", label: "TTR Manja 3h", shortLabel: "Manja" },
  { key: "ttr36Jam", label: "TTR 36 Jam", shortLabel: "TTR 36" },
  { key: "tti3x24Jam", label: "TTI 3x24 Jam", shortLabel: "TTI 3x24" },
  { key: "ffg", label: "FFG", shortLabel: "FFG" },
  { key: "ttrFfg", label: "TTR FFG", shortLabel: "TTR FFG" },
];

// ─── Trend color helpers ────────────────────────────────────────────────────

export function getTrendColor(trend: TrendEmoji | string) {
  switch (trend) {
    case "🟢": return { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-500" };
    case "🔴": return { text: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-500" };
    case "🟡":
    default:   return { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500" };
  }
}
