// ─── API Response Types ─────────────────────────────────────────────────────

export interface SummaryMetric {
  comply: number;
  notcomply: number;
  target: number;
  achievement: number;
}

export interface GaransiMetric {
  totalPS: number;
  totalTicket: number;
  achievement: number;
}

export interface DashboardSummary {
  "TTI INDIHOME": SummaryMetric;
  "FFG INDIHOME": SummaryMetric;
  "TTI INDIBIZ": SummaryMetric;
  "FFG INDIBIZ": SummaryMetric;
  "GARANSI INDIHOME": GaransiMetric;
  "GARANSI INDIBIZ": GaransiMetric;
}

export interface RankingSA {
  sa: string;
  achievement: number;
  ttiIH: number;
  ffgIH: number;
  garansiIH: number;
  ttiIB: number;
  ffgIB: number;
  garansiIB: number;
}

export interface RankingSTO {
  sto: string;
  achievement: number;
  ttiIH: number;
  ffgIH: number;
  garansiIH: number;
  ttiIB: number;
  ffgIB: number;
  garansiIB: number;
}

export interface TTITicket {
  SA: string;
  STO: string;
  SC: string;
  STATUS: "TTI-COMP" | "TTI-NOTC";
  SYMTOM: string;
  NULL_GDOC: boolean;
  REASON: string;
  EVIDENT: string;
  DURASI: number | string;
}

export interface FFGTicket {
  SA: string;
  STO: string;
  SC: string;
  STATUS: "TTR-COMP" | "TTR-NOTC";
  SYMTOM: string;
  NULL_GDOC: boolean;
  REASON: string;
  EVIDENT: string;
  DURASI: number | string;
}

/** Unified ticket type for both TTI and FFG */
export type Ticket = TTITicket | FFGTicket;

export interface KPISimulation {
  sa: string;
  kpi: string;
  actual: string;
  target: number;
  status: "ACHIEVE" | "NOT ACHIEVE";
  action: string;
}

export interface Resume {
  totalNullGdoc: number;
  ti_ih_notc: number;
  ti_ib_notc: number;
  ffg_ih_comp: number;
  ffg_ih_notc: number;
  ffg_ib_comp: number;
  ffg_ib_notc: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  rankingSA: RankingSA[];
  rankingSTO: RankingSTO[];
  ttiTickets: TTITicket[];
  ffgTickets: FFGTicket[];
  kpiSimulation: KPISimulation[];
  resume: Resume;
  branchBogor: KPISimulation[];
  branchBogorIncludeBanten: KPISimulation[];
}

// ─── Component Prop Types ───────────────────────────────────────────────────

export type Segment = "indihome" | "indibiz";

export type PerformanceMetricTab = "overall" | "tti" | "ttr-ffg" | "ffg" | "dipisah";

export interface SymptomAggregate {
  symptom: string;
  total: number;
  comp: number;
  nonc: number;
  serviceAreas: string[];
}

export interface SymptomBySA {
  sa: string;
  symptoms: { symptom: string; total: number; comp: number; nonc: number }[];
  totalTickets: number;
  totalComp: number;
  totalNonc: number;
}

export type SortDirection = "asc" | "desc";

export type KPIFilter =
  | "ALL"
  | "TTI IH"
  | "FFG IH"
  | "GARANSI IH"
  | "TTI IB"
  | "FFG IB"
  | "GARANSI IB";

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T) => React.ReactNode;
}
