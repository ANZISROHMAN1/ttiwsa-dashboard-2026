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

  dataRows.forEach((r) => {
    const no = parseInt(r[0]) || 0;
    const area = (r[1] || "-").trim();
    const regional = (r[2] || "-").trim();
    const district = (r[3] || "-").trim();
    const indikator = (r[4] || "-").trim();
    const target = (r[5] || "-").trim();
    const realisasi = (r[6] || "-").trim();
    const ach = (r[7] || "-").trim();
    const status = (r[8] || "N/A").trim();

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
    d.total++;
    const sUpper = status.toUpperCase();
    if (sUpper === "ACHIEVED" || sUpper === "ACH") {
      d.achieved++;
    } else if (sUpper.includes("NOT") || sUpper === "NOT ACHIEVED") {
      d.notAchieved++;
    } else {
      d.na++;
    }

    d.indicators.push({
      no,
      indikator,
      target,
      realisasi,
      ach,
      status,
    });
  });

  const districts = Array.from(districtMap.values()).map((d) => {
    const evaluated = d.achieved + d.notAchieved;
    const percent = evaluated > 0 ? (d.achieved / evaluated) * 100 : 0;
    const achRate = evaluated > 0 ? `${percent.toFixed(2)}%` : "-";

    // Calculate average achievement across achieved KPIs (each capped at 110%)
    let sumAch = 0;
    let countAch = 0;
    d.indicators.forEach((ind) => {
      const sUpper = ind.status.toUpperCase();
      if (sUpper === "ACHIEVED" || sUpper === "ACH") {
        const cleanAch = String(ind.ach).replace("%", "").replace(",", ".").trim();
        const num = parseFloat(cleanAch);
        if (!isNaN(num)) {
          sumAch += Math.min(110, num);
          countAch++;
        }
      }
    });
    const avgNum = countAch > 0 ? sumAch / countAch : 0;
    const average = `${avgNum.toFixed(2)}%`;

    return {
      ...d,
      percent: parseFloat(percent.toFixed(2)),
      achRate,
      average,
      avgNum,
    };
  });

  // Sort:
  // 1. achieved descending
  // 2. average descending (ties broken by average achievement across achieved KPIs only capped at 110%)
  // 3. percent descending
  // 4. initialIndex ascending (preserves the exact WISA order from file!)
  districts.sort((a, b) => {
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    const aAvg = a.avgNum ?? 0;
    const bAvg = b.avgNum ?? 0;
    if (bAvg !== aAvg) return bAvg - aAvg;
    if (b.percent !== a.percent) return b.percent - a.percent;
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
