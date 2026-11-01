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

  dataRows.forEach((r) => {
    const no = parseInt(r[0]) || 0;
    const area = r[1] || "-";
    const regional = r[2] || "-";
    const district = r[3] || "-";
    const indikator = r[4] || "-";
    const target = r[5] || "-";
    const realisasi = r[6] || "-";
    const ach = r[7] || "-";
    const status = (r[8] || "N/A").trim();

    if (area && area !== "-") areasSet.add(area);
    if (regional && regional !== "-") regionalsSet.add(regional);

    if (!districtMap.has(district)) {
      districtMap.set(district, {
        rank: 0,
        district,
        area,
        regional,
        achieved: 0,
        notAchieved: 0,
        na: 0,
        total: 0,
        percent: 0,
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
    return {
      ...d,
      percent: parseFloat(percent.toFixed(2)),
    };
  });

  // Sort: achieved descending, then percent descending, then district name
  districts.sort((a, b) => {
    if (b.achieved !== a.achieved) return b.achieved - a.achieved;
    if (b.percent !== a.percent) return b.percent - a.percent;
    return a.district.localeCompare(b.district);
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

