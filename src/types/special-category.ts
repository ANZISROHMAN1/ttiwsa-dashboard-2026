export interface SpecialCategoryMonthlyBreakdown {
  month: string;
  points: number;
  score: number;
  achievement: number;
  bonus: number;
  bonusDetail?: {
    sitePremium?: number;
    bonusScore?: number;
  } | null;
}

export interface SpecialCategoryLeaderboardItem {
  rank: number;
  regional: string;
  displayName: string;
  area_tif: string;
  totalPoints: number;
  totalScore: number;
  monthlyBreakdown: SpecialCategoryMonthlyBreakdown[];
}

export interface SpecialCategoryDataSection {
  kpiName: string;
  skippedMonths: string[];
  countedMonths: number;
  totalParticipants: number;
  leaderboard: SpecialCategoryLeaderboardItem[];
}

export interface SpecialCategoryData {
  from: string;
  to: string;
  months: string[];
  week: string;
  datin: SpecialCategoryDataSection;
  premiumSite: SpecialCategoryDataSection;
}

