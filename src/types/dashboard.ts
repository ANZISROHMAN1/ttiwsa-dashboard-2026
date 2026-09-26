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
  achievement: number; // For Leaderboard
  achievementIH: number;
  achievementIB: number;
  performance: number; // For Performance page
  performanceIH: number;
  performanceIB: number;
  saIH: number;
  asgarIH: number;
  diamondIH: number;
  platinumIH: number;
  manjaIH: number;
  ttr36IH: number;
  ttiIH: number;
  ffgIH: number;
  garansiIH: number;
  saIB: number;
  ttiIB: number;
  ffgIB: number;
  garansiIB: number;
  underspecIB: number;
  pspiIB: number;
  qggnIB: number;
  asgarHsiIB: number;
  asgarDtnIB: number;
  asgarWifiIB: number;
  ttr24jIB: number;
}

export interface RankingSTO {
  sto: string;
  achievement: number; // For Leaderboard
  achievementIH: number;
  achievementIB: number;
  performance: number; // For Performance page
  performanceIH: number;
  performanceIB: number;
  saIH: number;
  asgarIH: number;
  diamondIH: number;
  platinumIH: number;
  manjaIH: number;
  ttr36IH: number;
  ttiIH: number;
  ffgIH: number;
  garansiIH: number;
  saIB: number;
  ttiIB: number;
  ffgIB: number;
  garansiIB: number;
  underspecIB: number;
  pspiIB: number;
  qggnIB: number;
  asgarHsiIB: number;
  asgarDtnIB: number;
  asgarWifiIB: number;
  ttr24jIB: number;
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
  EVIDENT2?: string;
  EVIDENT3?: string;
  EVIDENT4?: string;
  EVIDENT5?: string;
  EVIDENT6?: string;
  EVIDENT7?: string;
  NAMA_TEKNISI?: string;
  NIK_TEKNISI?: string;
  MITRA?: string;
  DURASI: number | string;
  TIMESTAMP?: string;
  ITEM_NOT_COMPLY?: string;
  isUpdated?: boolean;
  kpi?: string;
  ORDER_TYPE?: string;
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
  EVIDENT2?: string;
  EVIDENT3?: string;
  EVIDENT4?: string;
  EVIDENT5?: string;
  EVIDENT6?: string;
  EVIDENT7?: string;
  NAMA_TEKNISI?: string;
  NIK_TEKNISI?: string;
  MITRA?: string;
  DURASI: number | string;
  kpi?: string;
  TIMESTAMP?: string;
  ITEM_NOT_COMPLY?: string;
  isUpdated?: boolean;
  ORDER_TYPE?: string;
}

export interface SaldoPspiTicket {
  SA: string;
  "Status PS/PI": string;
  "ERROR CODE": string;
  "SUB ERROR CODE": string;
  KETERANGAN: string;
  org_1: string;
  org_2: string;
  org_3: string;
  org_4: string;
  sto: string;
  ndem: string;
  ncli: number;
  ndos: number;
  nd: string;
  nd_speedy: number;
  ncx_orderid: string;
  sc_orderid: string;
  order_type: string;
  tgl_pi: string;
  tgl_complete: string;
  tgl_ca: string;
  tgl_un: string;
  tgl_open: string;
  tgl_revoke: string;
  last_status: string;
  f_pspi: string;
  sc_last_status: string;
  sc_last_status_message: string;
  bima_wonum: string;
  bima_errorcode: string;
  bima_suberrorcode: string;
  cgest: string;
  cseg: number;
  divisi: string;
  periode_pspi: number;
  lastupdate: string;
}

export interface UnspecTicket {
  SA: string;
  sto: string;
  nd_speedy: string | number;
  sc_orderid: string;
  last_status_ukur: string;
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
  saldoPspiTickets: SaldoPspiTicket[];
  unspecTickets: UnspecTicket[];
  kpiSimulation: KPISimulation[];
  resume: Resume;
  branchBogor: KPISimulation[];
  branchBogorIncludeBanten: KPISimulation[];
}

// ─── Component Prop Types ───────────────────────────────────────────────────

export type Segment = "indihome" | "indibiz";

export type PerformanceMetricTab = "overall" | "tti" | "ttr-ffg" | "ffg" | "dipisah" | "saldo-pspi" | "unspec";

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
