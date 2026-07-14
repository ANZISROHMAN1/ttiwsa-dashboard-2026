// ─── API Configuration ──────────────────────────────────────────────────────

export const SUBMIT_ENDPOINT_URL = process.env.SUBMIT_API_URL || "";
export const API_BASE_URL = process.env.TTIWSA_API_URL || "";
export const SALDO_PSPI_API_URL = process.env.PSPI_API_URL || "";
export const UNSPEC_API_URL = process.env.UNSPEC_API_URL || "";
export const REPORT_IH_EASTERN_API_URL = process.env.API_BARU_REPORT_IH_EASTERN || "";

/** Auto-refresh interval in milliseconds (5 minutes) */
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// ─── KPI Targets (from GAS backend) ────────────────────────────────────────

export const KPI_TARGET = {
  TTI_IH: 93.31,
  FFG_IH: 80.81,
  GARANSI_IH: 98.29,
  TTI_IB: 92,
  FFG_IB: 86,
  GARANSI_IB: 99.4,
} as const;

// ─── Performance Thresholds ─────────────────────────────────────────────────

export const THRESHOLD = {
  EXCELLENT: 90,
  GOOD: 80,
  WARNING: 70,
} as const;

// ─── Navigation ─────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: string; // SVG path data
  description: string;
  subItems?: { label: string; href: string; description: string }[];
}

/** SVG path data for nav icons (24x24 viewBox) */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    description: "Dashboard summary",
    subItems: [
      { label: "KPI Dashboard", href: "/", description: "Main KPI overview" },
      { label: "Report IH Eastern", href: "/report-ih-eastern", description: "District performance report" },
    ],
  },
  {
    label: "Performance",
    href: "/performance",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    description: "Ranking by Service Area",
  },
  {
    label: "KPI Analysis",
    href: "/symptoms",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    description: "KPI simulation & symptom analysis",
  },
  {
    label: "Submit Update",
    href: "/submit",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    description: "Submit ticket update",
    subItems: [
      { label: "Update Penyebab Not Comply", href: "/submit/not-comply", description: "TTI, FFG & TTR FFG" },
      { label: "Update PS/PI", href: "/submit/ps-pi", description: "PS/PI-Web Update" },
      { label: "Update UNSPEC", href: "/submit/unspec", description: "UNSPEC Update" }
    ]
  },
];

// ─── Metric Labels (matching reference image) ──────────────────────────────

export const METRIC_LABELS = {
  ttiIH: "TTI 3x24 Indihome",
  ffgIH: "TTR FFG Indihome",
  garansiIH: "FFG Indihome",
  ttiIB: "TTI 1x24 Indibiz",
  ffgIB: "TTR FFG Indibiz",
  garansiIB: "FFG Indibiz",
} as const;

/** Short labels for table headers */
export const METRIC_LABELS_SHORT = {
  ttiIH: "TTI",
  ffgIH: "TTR FFG",
  garansiIH: "FFG",
  ttiIB: "TTI",
  ffgIB: "TTR FFG",
  garansiIB: "FFG",
} as const;

/** Mapping from kpiSimulation `kpi` field to display labels */
export const KPI_SIM_LABELS: Record<string, string> = {
  "TTI IH": "TTI 3x24 Indihome",
  "FFG IH": "TTR FFG Indihome",
  "GARANSI IH": "FFG Indihome",
  "TTI IB": "TTI 1x24 Indibiz",
  "FFG IB": "TTR FFG Indibiz",
  "GARANSI IB": "FFG Indibiz",
};

export const SEGMENT_LABELS = {
  indihome: "Indihome",
  indibiz: "Indibiz",
} as const;

/** Performance tab options */
export const PERF_METRIC_TABS = [
  { value: "overall" as const, label: "Overall" },
  { value: "dipisah" as const, label: "Dipisah" },
  { value: "tti" as const, label: "TTI" },
  { value: "ttr-ffg" as const, label: "TTR FFG" },
  { value: "ffg" as const, label: "FFG (Garansi)" },
  { value: "saldo-pspi" as const, label: "SALDO PS/PI" },
  { value: "unspec" as const, label: "UNSPEC" },
];
