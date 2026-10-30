export interface PeriodMetric {
  ach: number | string | null;
  notAch: number | string | null;
  na: number | string | null;
  total: number | string | null;
  percent: string;
}

export interface SegmentSummaryRow {
  segmen: string;
  prevMonth: PeriodMetric;
  currentMonth: PeriodMetric;
  trend: string;
  districts: {
    bogor: PeriodMetric;
    bekasi: PeriodMetric;
    karawang: PeriodMetric;
  };
}

export interface SummaryVariations {
  standard: SegmentSummaryRow[];
  naDianggapAch: SegmentSummaryRow[];
  naDiexclude: SegmentSummaryRow[];
}

export interface DistrictMetric {
  real: number | string | null;
  ach: number | string | null;
}

export interface IndicatorRow {
  no: number;
  indikator: string;
  segmen: string;
  target: number | string | null;
  eastern: DistrictMetric;
  bogor: DistrictMetric;
  bekasi: DistrictMetric;
  karawang: DistrictMetric;
  formula?: {
    eastern: string;
    bogor: string;
    bekasi: string;
    karawang: string;
  };
  kpiRacing: boolean;
}

export interface PerformanceEasternData {
  periods: {
    prevPeriod: string;
    currentPeriod: string;
  };
  summaries: SummaryVariations;
  indicators: IndicatorRow[];
  lastUpdated: string;
}

