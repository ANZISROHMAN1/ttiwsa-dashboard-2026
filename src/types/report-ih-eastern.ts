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
  districtSummary: MetricSet;
  serviceAreas: ServiceAreaData[];
}

/** The full API response is an array of districts */
export type ReportIHEasternResponse = DistrictData[];

// ─── Monthly Trend Types (API_IH_TIGABULAN) ────────────────────────────────

/** Monthly values per STO: { "BOO": 99.16, "CJU": "", ... } */
export type MonthlySTOValues = Record<string, number | string>;

/** Monthly data for a single parameter / district in simple trend (EBIS): { "Jan '26": { STO values }, ... } */
export type MonthlyTrendDistrict = Record<string, MonthlySTOValues>;

/** Full simple trend API response: { "Trend Bogor-Sukabumi": { months... }, ... } */
export type MonthlyTrendResponse = Record<string, MonthlyTrendDistrict>;

/** Parameter-grouped trend district (API_IH_TIGABULAN): { "sa": { "Jan '26": { STO values } }, "asgar": { ... } } */
export type IHTrendDistrict = Record<string, MonthlyTrendDistrict>;

/** Full IH trend API response: { "Trend Bogor-Sukabumi": { "sa": { months... } }, ... } */
export type IHTrendResponse = Record<string, IHTrendDistrict>;

/** Mapping from trend API district keys to report district names */
export const TREND_DISTRICT_MAP: Record<string, string> = {
  "Trend Bogor-Sukabumi": "BOGOR - SUKABUMI",
  "Trend Bekasi": "BEKASI",
  "Trend Karawang": "KARAWANG",
};

// ─── Metric display config ──────────────────────────────────────────────────

export type MetricKey = keyof MetricSet;

export interface MetricConfig {
  key: MetricKey;
  label: string;
  shortLabel: string;
  trendKey?: string;
}

export const METRIC_CONFIGS: MetricConfig[] = [
  { key: "serviceAvailability", label: "Service Availability", shortLabel: "SA", trendKey: "sa" },
  { key: "assuranceGuarantee", label: "Assurance Guarantee", shortLabel: "ASGAR", trendKey: "asgar" },
  { key: "ttrCompDiamond3Jam", label: "TTR Diamond 3h", shortLabel: "Diamond", trendKey: "ttr3jD" },
  { key: "ttrCompPlatinum6Jam", label: "TTR Platinum 6h", shortLabel: "Platinum", trendKey: "ttr6jP" },
  { key: "ttrCompManja3Jam", label: "TTR Manja 3h", shortLabel: "Manja", trendKey: "ttr3jManja" },
  { key: "ttr36Jam", label: "TTR 36 Jam", shortLabel: "TTR 36", trendKey: "ttr36j" },
  { key: "tti3x24Jam", label: "TTI 3x24 Jam", shortLabel: "TTI 3x24", trendKey: "tti3x24Jam" },
  { key: "ffg", label: "Fulfillment Guarantee", shortLabel: "FFG", trendKey: "ffg" },
  { key: "ttrFfg", label: "TTR Fulfillment Guarantee", shortLabel: "TTR FFG", trendKey: "ttrFfg" },
];

export const WSA_TARGETS: Record<keyof MetricSet, number> = {
  serviceAvailability: 98.52,
  assuranceGuarantee: 91.71,
  ttrCompDiamond3Jam: 95.25,
  ttrCompPlatinum6Jam: 95.00,
  ttrCompManja3Jam: 94.79,
  ttr36Jam: 85.00,
  tti3x24Jam: 93.31,
  ffg: 98.29,
  ttrFfg: 80.81,
};

// ─── Trend color helpers ────────────────────────────────────────────────────

export function getTrendColor(trend: TrendEmoji | string) {
  switch (trend) {
    case "🟢": return { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-500" };
    case "🔴": return { text: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-500" };
    case "🟡":
    default:   return { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500" };
  }
}
