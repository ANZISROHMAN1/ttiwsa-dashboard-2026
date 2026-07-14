export type FrameworkCategory = 'WSA' | 'CNOP' | 'EBIS' | 'OLO' | 'NETWORK';

export interface TimeMetric {
  target: number;
  real: number | string;
  ach: number | string;
}

export interface FrameworkData {
  indikator: string;
  uic: string;
  regionalTif: string;
  district: string;
  satuan: string;
  w2: TimeMetric;
  w3: TimeMetric;
  w4: TimeMetric;
  fullMonth: TimeMetric;
  summaryAch: number;
  kategori: string; // "CNOP" | "EBIS" | "OLO" | "NETWORK"
}

export type ReportAllEasternResponse = FrameworkData[];
