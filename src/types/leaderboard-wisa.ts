export interface DistrictRacingIndicator {
  no: number;
  indikator: string;
  target: string | number;
  realisasi: string | number;
  ach: string | number;
  status: string;
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
  indicators: DistrictRacingIndicator[];
}

export interface LeaderboardWisaData {
  districts: DistrictRacingItem[];
  areas: string[];
  regionals: string[];
  totalDistricts: number;
}
