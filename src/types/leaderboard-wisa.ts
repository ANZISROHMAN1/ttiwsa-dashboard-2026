export interface DistrictRacingIndicator {
  no: number;
  indikator: string;
  target: string | number;
  realisasi: string | number;
  ach: string | number;
  status: string;
  isRacing?: boolean;
}

export interface DistrictRacingItem {
  rank: number;
  initialIndex: number;
  district: string;
  area: string;
  regional: string;
  achieved: number;
  notAchieved: number;
  na: number;
  total: number;
  percent: number;
  achRate: string;
  average: string;
  avgNum?: number;
  indicators: DistrictRacingIndicator[];

  // 65 KPI Total metrics (Evaluasi 65 KPI)
  achieved65?: number;
  notAchieved65?: number;
  na65?: number;
  total65?: number;
  percent65?: number;
  achRate65?: string;
  average65?: string;
  avgNum65?: number;
}

export interface LeaderboardWisaData {
  districts: DistrictRacingItem[];
  areas: string[];
  regionals: string[];
  totalDistricts: number;
}
