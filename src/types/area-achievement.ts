export interface RegionalAchievementItem {
  rank: number;
  regional: string;
  name: string;
  area: string;
  achRate: number;
  kpiAchieved: number;
  totalKpi: number;
  isEastern?: boolean;
}

export interface AreaAchievementItem {
  rank: number;
  area: string;
  name: string;
  achRate: number;
  kpiAchieved: number;
  totalKpi: number;
}

export interface AreaAchievementData {
  month: string;
  week: string;
  regional: RegionalAchievementItem[];
  area: AreaAchievementItem[];
  /** Official WISA Regional Racing KPI values (overrides district aggregation when present) */
  racingRegional?: RegionalAchievementItem[];
  /** Official WISA Area Racing KPI values */
  racingArea?: AreaAchievementItem[];
}

