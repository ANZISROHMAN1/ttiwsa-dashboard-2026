import type {
  PerformanceEasternData,
  SegmentSummaryRow,
  IndicatorRow,
  PeriodMetric,
} from "@/types/performance-eastern";

/** Parse a CSV string taking quotes into account */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  return lines.map((line) => {
    const res: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        res.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    res.push(cur.trim());
    return res;
  });
}

function cleanString(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function parseNum(val: any): number | string | null {
  if (val === undefined || val === null) return null;
  const s = cleanString(val);
  if (!s || s === "N/a" || s === "No Ticket" || s === "-") return s || null;
  const clean = s.replace(/%/g, "").replace(/,/g, ".");
  const num = parseFloat(clean);
  return isNaN(num) ? s : num;
}

function computeTrend(prevAch: any, currAch: any, explicitTrend?: string): string {
  if (explicitTrend && explicitTrend !== "%") return explicitTrend;
  if (typeof prevAch === "number" && typeof currAch === "number") {
    if (currAch > prevAch) return "↑";
    if (currAch < prevAch) return "↓";
    return "≈";
  }
  return "≈";
}

export function parsePerformanceEasternCSV(csvText: string): PerformanceEasternData {
  const rows = parseCSV(csvText);

  if (rows.length < 10) {
    throw new Error("Invalid CSV format: too few rows");
  }

  // Header period strings (Row 3, 0-indexed)
  const prevPeriod = cleanString(rows[3]?.[23]) || "REALISASI FM SEPTEMBER 2026";
  const currentPeriod = cleanString(rows[3]?.[28]) || "REALISASI W2 OKTOBER 2026";

  const parseSummaryBlock = (startRow: number): SegmentSummaryRow[] => {
    const segments: SegmentSummaryRow[] = [];
    for (let r = startRow; r <= startRow + 5; r++) {
      const row = rows[r];
      if (!row || !row[22]) continue;

      const segName = cleanString(row[22]);
      if (!segName) continue;

      const prevAch = parseNum(row[23]);
      const currAch = parseNum(row[28]);
      const explicitTrend = cleanString(row[33]);

      const prevMonth: PeriodMetric = {
        ach: prevAch,
        notAch: parseNum(row[24]),
        na: parseNum(row[25]),
        total: parseNum(row[26]),
        percent: cleanString(row[27]),
      };

      const currentMonth: PeriodMetric = {
        ach: currAch,
        notAch: parseNum(row[29]),
        na: parseNum(row[30]),
        total: parseNum(row[31]),
        percent: cleanString(row[32]),
      };

      segments.push({
        segmen: segName,
        prevMonth,
        currentMonth,
        trend: computeTrend(prevAch, currAch, explicitTrend),
        districts: {
          bogor: {
            ach: parseNum(row[36]),
            notAch: parseNum(row[37]),
            na: parseNum(row[38]),
            total: parseNum(row[39]),
            percent: cleanString(row[40]),
          },
          bekasi: {
            ach: parseNum(row[41]),
            notAch: parseNum(row[42]),
            na: parseNum(row[43]),
            total: parseNum(row[44]),
            percent: cleanString(row[45]),
          },
          karawang: {
            ach: parseNum(row[46]),
            notAch: parseNum(row[47]),
            na: parseNum(row[48]),
            total: parseNum(row[49]),
            percent: cleanString(row[50]),
          },
        },
      });
    }
    return segments;
  };

  const standard = parseSummaryBlock(5);
  const naDianggapAch = parseSummaryBlock(16);
  const naDiexclude = parseSummaryBlock(27);

  // Indicators: Rows 3 to end of indicators list (until no indicator name)
  const indicators: IndicatorRow[] = [];
  for (let r = 3; r < rows.length; r++) {
    const row = rows[r];
    const indikatorName = cleanString(row[1]);
    if (!indikatorName) continue;

    indicators.push({
      no: parseInt(row[0]) || indicators.length + 1,
      indikator: indikatorName,
      segmen: cleanString(row[2]),
      target: parseNum(row[3]),
      eastern: {
        real: parseNum(row[4]),
        ach: parseNum(row[5]),
      },
      bogor: {
        real: parseNum(row[6]),
        ach: parseNum(row[7]),
      },
      bekasi: {
        real: parseNum(row[8]),
        ach: parseNum(row[9]),
      },
      karawang: {
        real: parseNum(row[10]),
        ach: parseNum(row[11]),
      },
      formula: {
        eastern: cleanString(row[12]),
        bogor: cleanString(row[13]),
        bekasi: cleanString(row[14]),
        karawang: cleanString(row[15]),
      },
      kpiRacing: cleanString(row[16]).toUpperCase() === "YES",
    });
  }

  return {
    periods: {
      prevPeriod,
      currentPeriod,
    },
    summaries: {
      standard,
      naDianggapAch,
      naDiexclude,
    },
    indicators,
    lastUpdated: new Date().toISOString(),
  };
}

