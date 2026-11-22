import type {
  LeaderboardWisaData,
  DistrictRacingItem,
  DistrictRacingIndicator,
} from "@/types/leaderboard-wisa";

/** Parse a CSV string taking quotes into account */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const row: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    row.push(cur.trim());
    rows.push(row);
  }
  return rows;
}

export const NON_RACING_INDICATOR_PATTERNS = [
  /mttri premium site compliance/i,
  /ttr compliance k2 dan k1 repair datin/i,
  /ticket non-\s*numbering/i,
  /underspec warranty guarantee non hsi/i,
  /compliance order aging/i,
  /fallout order compliance/i,
  /compliance sl wdm/i,
  /who-ttd compliance datin/i,
  /who-ttd compliance in/i,
  /who-ttd compliance sip trunk/i,
  /ttr compliance k1 datin 43 menit/i,
  /ttr indibiz hvc \(4 jam\)/i,
  /mttrq ran to core major/i,
  /mttrq ran to core minor/i,
  /mttrq ran to core critical/i,
];

export function isRacingIndicator(indikatorName: string): boolean {
  return !NON_RACING_INDICATOR_PATTERNS.some((p) => p.test(indikatorName));
}

export function parseLeaderboardWisaCSV(csvText: string): LeaderboardWisaData {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return { districts: [], areas: [], regionals: [], totalDistricts: 0 };
  }

  const dataRows = rows.slice(1);
  const districtMap = new Map<string, DistrictRacingItem>();
  const areasSet = new Set<string>();
  const regionalsSet = new Set<string>();
  let districtCounter = 0;
  let currentArea = "";
  let currentRegional = "";
  let currentDistrict = "";

  dataRows.forEach((r) => {
    const no = parseInt(r[0]) || 0;
    const rawArea = (r[1] || "").trim();
    const rawRegional = (r[2] || "").trim();
    const rawDistrict = (r[3] || "").trim();
    const indikator = (r[4] || "-").trim();
    const target = (r[5] || "-").trim();
    const realisasi = (r[6] || "-").trim();
    const ach = (r[7] || "-").trim();
    const status = (r[8] || "N/A").trim();

    // Propagate / forward-fill District & Regional when merged or omitted in subsequent rows
    if (no === 1) {
      currentArea = rawArea;
      currentRegional = rawRegional;
      currentDistrict = rawDistrict;
    } else {
      if (rawArea) currentArea = rawArea;
      if (rawRegional) currentRegional = rawRegional;
      if (rawDistrict) currentDistrict = rawDistrict;
    }

    const area = currentArea || rawArea || "-";
    const regional = currentRegional || rawRegional || "-";
    const district = currentDistrict || rawDistrict;

    if (!district || district === "-") return;

    if (area && area !== "-") areasSet.add(area);
    if (regional && regional !== "-") regionalsSet.add(regional);

    if (!districtMap.has(district)) {
      districtCounter++;
      districtMap.set(district, {
        rank: 0,
        initialIndex: districtCounter,
        district,
        area,
        regional,
        achieved: 0,
        notAchieved: 0,
        na: 0,
        total: 0,
        percent: 0,
        achRate: "-",
        average: "0.00%",
        indicators: [],
      });
    }

    const d = districtMap.get(district)!;
    const isRacing = isRacingIndicator(indikator);

    d.indicators.push({
      no,
      indikator,
      target,
      realisasi,
      ach,
      status,
      isRacing,
    });
  });

  const districts = Array.from(districtMap.values())
    .filter((d) => d.indicators.length >= 30)
    .map((d) => {
    // 1. Compute 50 Racing KPI metrics (Official District Racing WISA)
    const racingIndicators = d.indicators.filter((ind) => ind.isRacing);
    let racingAch = 0;
    let racingNotAch = 0;
    let racingNa = 0;
    let sumAchRacing = 0;
    let countAchRacing = 0;

    racingIndicators.forEach((ind) => {
      const sUpper = ind.status.toUpperCase();
      if (sUpper === "ACHIEVED" || sUpper === "ACH") {
        racingAch++;
        const cleanAch = String(ind.ach).replace("%", "").replace(",", ".").trim();
        const num = parseFloat(cleanAch);
        if (!isNaN(num)) {
          sumAchRacing += Math.min(110, num);
          countAchRacing++;
        }
      } else if (sUpper.includes("NOT") || sUpper === "NOT ACHIEVED") {
        racingNotAch++;
      } else {
        racingNa++;
      }
    });

    const evaluatedRacing = racingAch + racingNotAch;
    const percentRacing = evaluatedRacing > 0 ? (racingAch / evaluatedRacing) * 100 : 0;
    const achRateRacing = evaluatedRacing > 0 ? `${percentRacing.toFixed(2)}%` : "-";
    const avgNumRacing = countAchRacing > 0 ? sumAchRacing / countAchRacing : 0;
    const averageRacing = `${avgNumRacing.toFixed(2)}%`;

    // 2. Compute 65 KPI Total metrics (Evaluasi 65 KPI)
    let ach65 = 0;
    let notAch65 = 0;
    let na65 = 0;
    let sumAch65 = 0;
    let countAch65 = 0;

    d.indicators.forEach((ind) => {
      const sUpper = ind.status.toUpperCase();
      if (sUpper === "ACHIEVED" || sUpper === "ACH") {
        ach65++;
        const cleanAch = String(ind.ach).replace("%", "").replace(",", ".").trim();
        const num = parseFloat(cleanAch);
        if (!isNaN(num)) {
          sumAch65 += Math.min(110, num);
          countAch65++;
        }
      } else if (sUpper.includes("NOT") || sUpper === "NOT ACHIEVED") {
        notAch65++;
      } else {
        na65++;
      }
    });

    const evaluated65 = ach65 + notAch65;
    const percent65 = evaluated65 > 0 ? (ach65 / evaluated65) * 100 : 0;
    const achRate65 = evaluated65 > 0 ? `${percent65.toFixed(2)}%` : "-";
    const avgNum65 = countAch65 > 0 ? sumAch65 / countAch65 : 0;
    const average65 = `${avgNum65.toFixed(2)}%`;

    return {
      ...d,
      // Default metrics: EXACTLY 50 Racing KPIs matching WISA District Racing!
      achieved: racingAch,
      notAchieved: racingNotAch,
      na: racingNa,
      total: racingIndicators.length || 50,
      percent: parseFloat(percentRacing.toFixed(2)),
      achRate: achRateRacing,
      average: averageRacing,
      avgNum: avgNumRacing,

      // Also store 65 KPI metrics
      achieved65: ach65,
      notAchieved65: notAch65,
      na65: na65,
      total65: d.indicators.length || 65,
      percent65: parseFloat(percent65.toFixed(2)),
      achRate65,
      average65,
      avgNum65,
    };
  });

  // Sort:
  // 1. percent descending (Ach Rate)
  // 2. average descending (ties broken by average achievement across achieved KPIs only capped at 110%)
  // 3. achieved descending
  // 4. initialIndex ascending (preserves the exact WISA order from file!)
  districts.sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    const aAvg = a.avgNum ?? 0;
    const bAvg = b.avgNum ?? 0;
    if (bAvg !== aAvg) return bAvg - aAvg;
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    return a.initialIndex - b.initialIndex;
  });

  districts.forEach((d, idx) => {
    d.rank = idx + 1;
  });

  return {
    districts,
    areas: Array.from(areasSet).sort(),
    regionals: Array.from(regionalsSet).sort(),
    totalDistricts: districts.length,
  };
}
