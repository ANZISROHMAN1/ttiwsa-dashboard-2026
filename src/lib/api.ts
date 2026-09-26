import { API_BASE_URL, SALDO_PSPI_API_URL, UNSPEC_API_URL, EVIDENCE_API_URL, KPI_TARGET, REPORT_IH_EASTERN_API_URL, EBIS_API_URL } from "./constants";
import type { DashboardData, SaldoPspiTicket, UnspecTicket, KPISimulation, TTITicket, FFGTicket, RankingSA, RankingSTO, DashboardSummary, Resume } from "@/types/dashboard";
import { getCachedData, setCachedData } from "./redisCache";

// ─── API Error ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Feed Level Caching Helper ─────────────────────────────────────────────

const memoryCacheFeed = new Map<string, { data: any; timestamp: number }>();
const FEED_TTL_MS = 60 * 1000;

async function getFeedData<T>(key: string, fetcher: () => Promise<T>, forceRefresh: boolean): Promise<T> {
  if (!forceRefresh) {
    const redisCached = await getCachedData<T>(key);
    if (redisCached !== null) {
      return redisCached;
    }
    const memCached = memoryCacheFeed.get(key);
    if (memCached && Date.now() - memCached.timestamp < FEED_TTL_MS) {
      return memCached.data as T;
    }
  }

  const fresh = await fetcher();
  memoryCacheFeed.set(key, { data: fresh, timestamp: Date.now() });
  await setCachedData(key, fresh, 60);
  return fresh;
}

// ─── Fetch Dashboard Data ───────────────────────────────────────────────────

export async function fetchDashboardData(
  signal?: AbortSignal,
  basic: boolean = false,
  refreshTarget?: "regular" | "pspi" | "unspec" | "all"
): Promise<DashboardData> {
  try {
    if (!API_BASE_URL || !SALDO_PSPI_API_URL || !UNSPEC_API_URL || !EVIDENCE_API_URL) {
      throw new ApiError(
        "API URLs are not configured. Please ensure API are set in your environment variables.",
        500
      );
    }

    const refreshRegular = refreshTarget === "regular" || refreshTarget === "all";
    const refreshPspi = refreshTarget === "pspi" || refreshTarget === "all";
    const refreshUnspec = refreshTarget === "unspec" || refreshTarget === "all";

    const [rawData, saldoPspiTickets, unspecTickets, evidenceData, reportIh, reportIb] = await Promise.all([
      getFeedData(
        "feed_raw_ttiwsa",
        async () => {
          const res = await fetch(API_BASE_URL, { signal, next: { revalidate: 0 } });
          if (!res.ok) throw new ApiError(`API returned ${res.status}: ${res.statusText}`, res.status);
          return res.json();
        },
        refreshRegular
      ),
      basic
        ? Promise.resolve([])
        : getFeedData<SaldoPspiTicket[]>(
            "feed_saldo_pspi",
            async () => {
              const res = await fetch(SALDO_PSPI_API_URL, { signal, next: { revalidate: 0 } });
              if (!res.ok) {
                console.error(`Saldo API returned ${res.status}: ${res.statusText}`);
                return [];
              }
              return res.json();
            },
            refreshPspi
          ),
      basic
        ? Promise.resolve([])
        : getFeedData<UnspecTicket[]>(
            "feed_unspec",
            async () => {
              const res = await fetch(UNSPEC_API_URL, { signal, next: { revalidate: 0 } });
              if (!res.ok) {
                console.error(`Unspec API returned ${res.status}: ${res.statusText}`);
                return [];
              }
              return res.json();
            },
            refreshUnspec
          ),
      basic
        ? Promise.resolve([])
        : getFeedData<any[]>(
            "feed_evidence",
            async () => {
              const res = await fetch(EVIDENCE_API_URL, { signal, next: { revalidate: 0 } });
              if (!res.ok) {
                console.error(`Evidence API returned ${res.status}: ${res.statusText}`);
                return [];
              }
              return res.json();
            },
            refreshRegular
          ),
      basic
        ? Promise.resolve([])
        : getFeedData<any>(
            "feed_report_ih",
            async () => {
              const res = await fetch(REPORT_IH_EASTERN_API_URL, { signal, next: { revalidate: 0 } });
              return res.ok ? res.json() : [];
            },
            refreshRegular
          ),
      basic
        ? Promise.resolve([])
        : getFeedData<any>(
            "feed_report_ib",
            async () => {
              const res = await fetch(EBIS_API_URL, { signal, next: { revalidate: 0 } });
              return res.ok ? res.json() : [];
            },
            refreshRegular
          ),
    ]);

    const evidenceMap = new Map<string, any>();
    for (const ev of evidenceData) {
      const sc = ev["NOMOR ORDER / NOMOR TIKET INCIDENT"];
      if (sc) evidenceMap.set(sc, ev);
    }


    const getMergedEvidence = (sc: string, ttiwsaEvidence: string) => {
      let teknisi = "";
      let nik = "";
      let mitra = "";

      const newEv = evidenceMap.get(sc);
      if (newEv) {
        teknisi = newEv["NAMA TEKNISI"] || "";
        nik = String(newEv["NIK TEKNISI"] || "");
        mitra = newEv["MITRA"] || "";
      }

      return {
        EVIDENT: (ttiwsaEvidence && ttiwsaEvidence.trim()) || "",
        EVIDENT2: newEv?.["EVIDENCE 1"] || "",
        EVIDENT3: newEv?.["EVIDENCE 2"] || "",
        EVIDENT4: newEv?.["EVIDENCE 3"] || "",
        EVIDENT5: newEv?.["EVIDENCE 4"] || "",
        EVIDENT6: newEv?.["BA GANGGUAN FFG PELANGGAN"] || "",
        EVIDENT7: newEv?.["FOTO DENGAN PELANGGAN MEMEGANG BA"] || "",
        NAMA_TEKNISI: teknisi,
        NIK_TEKNISI: nik,
        MITRA: mitra,
        isUpdated: !!newEv
      };
    };

    const internalTti: (TTITicket & { kpi: string })[] = [];
    const internalFfg: (FFGTicket & { kpi: string })[] = [];
    const psIhList: { sa: string; sto: string; jml: number }[] = [];
    const psIbList: { sa: string; sto: string; jml: number }[] = [];
    const matchedSCs = new Set<string>();

    let totalNullGdoc = 0;
    let ti_ih_notc = 0;
    let ti_ib_notc = 0;
    let ffg_ih_comp = 0;
    let ffg_ih_notc = 0;
    let ffg_ib_comp = 0;
    let ffg_ib_notc = 0;

    for (const row of rawData) {
      if (row['SC-TTI-IH']) {
        matchedSCs.add(String(row['SC-TTI-IH']).trim());
        const isNullGdoc = row['SYMTOM-TTI-IH']?.trim() === 'NULL GDOC' || row['REASON-TTI-IH']?.trim() === 'NULL GDOC';
        if (isNullGdoc) totalNullGdoc++;
        if (row['STATUS-TTI-IH'] === 'TTI-NOTC') ti_ih_notc++;
        const evMerged = getMergedEvidence(row['SC-TTI-IH'], row['EVIDENT-TTI-IH']);
        internalTti.push({
          SA: row['SA-TTI-IH'], STO: row['STO-TTI-IH'], SC: row['SC-TTI-IH'],
          STATUS: row['STATUS-TTI-IH'] as any, SYMTOM: row['SYMTOM-TTI-IH']?.trim(),
          NULL_GDOC: isNullGdoc,
          REASON: row['REASON-TTI-IH'],
          EVIDENT: evMerged.EVIDENT,
          EVIDENT2: evMerged.EVIDENT2, EVIDENT3: evMerged.EVIDENT3, EVIDENT4: evMerged.EVIDENT4, EVIDENT5: evMerged.EVIDENT5, EVIDENT6: evMerged.EVIDENT6, EVIDENT7: evMerged.EVIDENT7,
          NAMA_TEKNISI: evMerged.NAMA_TEKNISI, NIK_TEKNISI: evMerged.NIK_TEKNISI, MITRA: evMerged.MITRA,
          DURASI: row['DURASI-TTI-IH'],
          kpi: 'TTI IH',
          isUpdated: evMerged.isUpdated
        });
      }
      if (row['SC-FFG-IH']) {
        matchedSCs.add(String(row['SC-FFG-IH']).trim());
        const isNullGdoc = row['SYMTOM-FFG-IH']?.trim() === 'NULL GDOC' || row['REASON-FFG-IH']?.trim() === 'NULL GDOC';
        if (isNullGdoc) totalNullGdoc++;
        if (row['STATUS-FFG-IH'] === 'TTR-COMP') ffg_ih_comp++;
        if (row['STATUS-FFG-IH'] === 'TTR-NOTC') ffg_ih_notc++;
        const evMerged = getMergedEvidence(row['SC-FFG-IH'], row['EVIDENT-FFG-IH']);
        internalFfg.push({
          SA: row['SA-FFG-IH'], STO: row['STO-FFG-IH'], SC: row['SC-FFG-IH'],
          STATUS: row['STATUS-FFG-IH'] as any, SYMTOM: row['SYMTOM-FFG-IH']?.trim(),
          NULL_GDOC: isNullGdoc,
          REASON: row['REASON-FFG-IH'],
          EVIDENT: evMerged.EVIDENT,
          EVIDENT2: evMerged.EVIDENT2, EVIDENT3: evMerged.EVIDENT3, EVIDENT4: evMerged.EVIDENT4, EVIDENT5: evMerged.EVIDENT5, EVIDENT6: evMerged.EVIDENT6, EVIDENT7: evMerged.EVIDENT7,
          NAMA_TEKNISI: evMerged.NAMA_TEKNISI, NIK_TEKNISI: evMerged.NIK_TEKNISI, MITRA: evMerged.MITRA,
          DURASI: row['DURASI-FFG-IH'],
          kpi: 'FFG IH',
          isUpdated: evMerged.isUpdated
        });
      }
      if (row['SC-TTI-IB']) {
        matchedSCs.add(String(row['SC-TTI-IB']).trim());
        const isNullGdoc = row['SYMTOM-TTI-IB']?.trim() === 'NULL GDOC' || row['REASON-TTI-IB']?.trim() === 'NULL GDOC';
        if (isNullGdoc) totalNullGdoc++;
        if (row['STATUS-TTI-IB'] === 'TTI-NOTC') ti_ib_notc++;
        const evMerged = getMergedEvidence(row['SC-TTI-IB'], row['EVIDENT-TTI-IB']);
        internalTti.push({
          SA: row['SA-TTI-IB'], STO: row['STO-TTI-IB'], SC: row['SC-TTI-IB'],
          STATUS: row['STATUS-TTI-IB'] as any, SYMTOM: row['SYMTOM-TTI-IB']?.trim(),
          NULL_GDOC: isNullGdoc,
          REASON: row['REASON-TTI-IB'],
          EVIDENT: evMerged.EVIDENT,
          EVIDENT2: evMerged.EVIDENT2, EVIDENT3: evMerged.EVIDENT3, EVIDENT4: evMerged.EVIDENT4, EVIDENT5: evMerged.EVIDENT5, EVIDENT6: evMerged.EVIDENT6, EVIDENT7: evMerged.EVIDENT7,
          NAMA_TEKNISI: evMerged.NAMA_TEKNISI, NIK_TEKNISI: evMerged.NIK_TEKNISI, MITRA: evMerged.MITRA,
          DURASI: row['DURASI-TTI-IB'],
          kpi: 'TTI IB',
          ORDER_TYPE: row['TYPETTI-IB']?.trim(),
          isUpdated: evMerged.isUpdated
        });
      }
      if (row['SC-FFG-IB']) {
        matchedSCs.add(String(row['SC-FFG-IB']).trim());
        const isNullGdoc = row['SYMTOM-FFG-IB']?.trim() === 'NULL GDOC' || row['REASON-FFG-IB']?.trim() === 'NULL GDOC';
        if (isNullGdoc) totalNullGdoc++;
        if (row['STATUS-FFG-IB'] === 'TTR-COMP') ffg_ib_comp++;
        if (row['STATUS-FFG-IB'] === 'TTR-NOTC') ffg_ib_notc++;
        const evMerged = getMergedEvidence(row['SC-FFG-IB'], row['EVIDENT-FFG-IB']);
        internalFfg.push({
          SA: row['SA-FFG-IB'], STO: row['STO-FFG-IB'], SC: row['SC-FFG-IB'],
          STATUS: row['STATUS-FFG-IB'] as any, SYMTOM: row['SYMTOM-FFG-IB']?.trim(),
          NULL_GDOC: isNullGdoc,
          REASON: row['REASON-FFG-IB'],
          EVIDENT: evMerged.EVIDENT,
          EVIDENT2: evMerged.EVIDENT2, EVIDENT3: evMerged.EVIDENT3, EVIDENT4: evMerged.EVIDENT4, EVIDENT5: evMerged.EVIDENT5, EVIDENT6: evMerged.EVIDENT6, EVIDENT7: evMerged.EVIDENT7,
          NAMA_TEKNISI: evMerged.NAMA_TEKNISI, NIK_TEKNISI: evMerged.NIK_TEKNISI, MITRA: evMerged.MITRA,
          DURASI: row['DURASI-FFG-IB'],
          kpi: 'FFG IB',
          isUpdated: evMerged.isUpdated
        });
      }
      if (row['PS-SA-IH']) {
        psIhList.push({ sa: row['PS-SA-IH'], sto: row['PS-STO-IH'], jml: Number(row['Jml PS-IH']) || 0 });
      }
      if (row['PS-SA-IB']) {
        psIbList.push({ sa: row['PS-SA-IB'], sto: row['PS-STO-IB'], jml: Number(row['Jml PS-IB']) || 0 });
      }
    }

    for (const ev of evidenceData) {
      const rawSc = ev["NOMOR ORDER / NOMOR TIKET INCIDENT"];
      const sc = rawSc ? String(rawSc).trim() : null;
      if (sc && !matchedSCs.has(sc)) {
        internalTti.push({
          SA: "UNKNOWN",
          STO: ev["STO"] || "UNKNOWN",
          SC: sc,
          STATUS: "UPDATED-COMP" as any,
          SYMTOM: ev["SYMTOM KENDALA"] || "SUDAH UPDATE",
          NULL_GDOC: false,
          REASON: ev["KETERANGAN DETAIL KENDALA"] || "",
          EVIDENT: ev["EVIDENCE 1"] || "",
          EVIDENT2: ev["EVIDENCE 2"] || "",
          EVIDENT3: ev["EVIDENCE 3"] || "",
          EVIDENT4: ev["EVIDENCE 3"] || "",
          EVIDENT5: ev["EVIDENCE 4"] || "",
          EVIDENT6: ev["BA GANGGUAN FFG PELANGGAN"] || "",
          EVIDENT7: ev["FOTO DENGAN PELANGGAN MEMEGANG BA"] || "",
          NAMA_TEKNISI: ev["NAMA TEKNISI"] || "",
          NIK_TEKNISI: String(ev["NIK TEKNISI"] || ""),
          MITRA: ev["MITRA"] || "",
          DURASI: 0,
          kpi: 'UPDATED',
          TIMESTAMP: ev["Timestamp"] || "",
          ITEM_NOT_COMPLY: ev["ITEM NOT COMPLY"] || "",
          isUpdated: true
        });
      }
    }

    const resume: Resume = {
      totalNullGdoc, ti_ih_notc, ti_ib_notc, ffg_ih_comp, ffg_ih_notc, ffg_ib_comp, ffg_ib_notc
    };

    const getMetric = (tickets: any[], kpiTag: string, target: number) => {
      const filtered = tickets.filter(t => t.kpi === kpiTag);
      const comply = filtered.filter(t => t.STATUS.includes('COMP')).length;
      const notcomply = filtered.length - comply;
      const achievement = filtered.length > 0 ? (comply / filtered.length) * 100 : 100;
      return { comply, notcomply, target, achievement };
    };

    const getGaransi = (psList: any[], tickets: any[], kpiTag: string) => {
      const totalPS = psList.reduce((acc, p) => acc + p.jml, 0);
      const totalTicket = tickets.filter(t => t.kpi === kpiTag).length;
      const achievement = totalPS > 0 ? ((totalPS - totalTicket) / totalPS) * 100 : 100;
      return { totalPS, totalTicket, achievement };
    };

    const summary: DashboardSummary = {
      "TTI INDIHOME": getMetric(internalTti, 'TTI IH', KPI_TARGET["TTI_IH"]),
      "FFG INDIHOME": getMetric(internalFfg, 'FFG IH', KPI_TARGET["FFG_IH"]),
      "TTI INDIBIZ": getMetric(internalTti, 'TTI IB', KPI_TARGET["TTI_IB"]),
      "FFG INDIBIZ": getMetric(internalFfg, 'FFG IB', KPI_TARGET["FFG_IB"]),
      "GARANSI INDIHOME": getGaransi(psIhList, internalFfg, 'FFG IH'),
      "GARANSI INDIBIZ": getGaransi(psIbList, internalFfg, 'FFG IB')
    };

    const parseVal = (v: any) => {
      if (typeof v === 'number') return v;
      if (!v) return 0;
      return parseFloat(String(v).replace(',', '.')) || 0;
    };

    const ihDistricts = Array.isArray(reportIh) ? reportIh : (reportIh?.Data || []);
    const ibDistricts = Array.isArray(reportIb) ? reportIb : (reportIb?.Data || []);

    const saMap = new Map<string, any>();
    const stoMap = new Map<string, any>();

    const initData = (name: string, isSA: boolean) => ({
      [isSA ? 'sa' : 'sto']: name,
      achievement: 0,
      ttiIH: 0, ffgIH: 0, garansiIH: 0,
      ttiIB: 0, ffgIB: 0, garansiIB: 0
    });

    ihDistricts.forEach((d: any) => {
      d.serviceAreas?.forEach((sa: any) => {
        const name = sa.serviceArea.toUpperCase();
        if (!saMap.has(name)) saMap.set(name, initData(sa.serviceArea, true));
        const row = saMap.get(name);
        row.ttiIH = parseVal(sa.summary?.tti3x24Jam?.real);
        row.ffgIH = parseVal(sa.summary?.ttrFfg?.real);
        row.garansiIH = parseVal(sa.summary?.ffg?.real);
        
        sa.stos?.forEach((sto: any) => {
          const stoName = sto.sto.toUpperCase();
          if (!stoMap.has(stoName)) stoMap.set(stoName, initData(sto.sto, false));
          const stoRow = stoMap.get(stoName);
          stoRow.ttiIH = parseVal(sto.summary?.tti3x24Jam?.real);
          stoRow.ffgIH = parseVal(sto.summary?.ttrFfg?.real);
          stoRow.garansiIH = parseVal(sto.summary?.ffg?.real);
        });
      });
    });

    ibDistricts.forEach((d: any) => {
      d.serviceAreas?.forEach((sa: any) => {
        const name = sa.serviceArea.toUpperCase();
        if (!saMap.has(name)) saMap.set(name, initData(sa.serviceArea, true));
        const row = saMap.get(name);
        row.ttiIB = parseVal(sa.summary?.tti1X24Jam?.real);
        row.ffgIB = parseVal(sa.summary?.ttrFulfillmentGuarantee3Jam?.real || sa.summary?.ttrFfg?.real);
        row.garansiIB = parseVal(sa.summary?.fulfillmentGuarantee?.real);
        
        sa.stos?.forEach((sto: any) => {
          const stoName = sto.sto.toUpperCase();
          if (!stoMap.has(stoName)) stoMap.set(stoName, initData(sto.sto, false));
          const stoRow = stoMap.get(stoName);
          stoRow.ttiIB = parseVal(sto.summary?.tti1X24Jam?.real);
          stoRow.ffgIB = parseVal(sto.summary?.ttrFulfillmentGuarantee3Jam?.real || sto.summary?.ttrFfg?.real);
          stoRow.garansiIB = parseVal(sto.summary?.fulfillmentGuarantee?.real);
        });
      });
    });

    const rankingSA: RankingSA[] = Array.from(saMap.values()).map((row) => {
      row.achievement = (row.ttiIH + row.ffgIH + row.garansiIH + row.ttiIB + row.ffgIB + row.garansiIB) / 6;
      return row;
    }).sort((a, b) => b.achievement - a.achievement);

    const rankingSTO: RankingSTO[] = Array.from(stoMap.values()).map((row) => {
      row.achievement = (row.ttiIH + row.ffgIH + row.garansiIH + row.ttiIB + row.ffgIB + row.garansiIB) / 6;
      return row;
    }).sort((a, b) => b.achievement - a.achievement);

    const calcSimulation = (sa: string, kpi: string, target: number, actual: number, total: number, comply: number) => {
      let status: "ACHIEVE" | "NOT ACHIEVE" = actual >= target ? "ACHIEVE" : "NOT ACHIEVE";
      let action = "TARGET TERCAPAI";
      if (status === "NOT ACHIEVE") {
        const needed = Math.ceil((target * total - 100 * comply) / (100 - target));
        action = `Butuh ${Math.max(0, needed)} tiket COMP tambahan`;
      } else if (total === 0 && actual === 0) {
        actual = 100;
        status = "ACHIEVE";
      }
      return { sa, kpi, actual: actual.toFixed(2), target, status, action };
    };

    const calcGaransiSim = (sa: string, kpi: string, target: number, actual: number, ps: number, tickets: number) => {
      let status: "ACHIEVE" | "NOT ACHIEVE" = actual >= target ? "ACHIEVE" : "NOT ACHIEVE";
      let action = "TARGET TERCAPAI";
      if (status === "NOT ACHIEVE") {
        const ticketsAllowed = (100 - target) * ps / 100;
        const toReduce = tickets - Math.floor(ticketsAllowed);
        action = `Kurangi ${Math.max(0, toReduce)} ticket FFG`;
      } else if (ps === 0 && actual === 0) {
        actual = 100;
        status = "ACHIEVE";
      }
      return { sa, kpi, actual: actual.toFixed(2), target, status, action };
    };

    const generateSimulations = (saFilter: string, saName: string) => {
      const ticketsFilter = saFilter ? (t: any) => t.SA === saFilter : () => true;
      const psIhFilter = saFilter ? (p: any) => p.sa === saFilter : () => true;
      const psIbFilter = saFilter ? (p: any) => p.sa === saFilter : () => true;

      const m1 = getMetric(internalTti.filter(ticketsFilter), 'TTI IH', KPI_TARGET["TTI_IH"]);
      const m2 = getMetric(internalFfg.filter(ticketsFilter), 'FFG IH', KPI_TARGET["FFG_IH"]);
      const m3 = getMetric(internalTti.filter(ticketsFilter), 'TTI IB', KPI_TARGET["TTI_IB"]);
      const m4 = getMetric(internalFfg.filter(ticketsFilter), 'FFG IB', KPI_TARGET["FFG_IB"]);
      const g1 = getGaransi(psIhList.filter(psIhFilter), internalFfg.filter(ticketsFilter), 'FFG IH');
      const g2 = getGaransi(psIbList.filter(psIbFilter), internalFfg.filter(ticketsFilter), 'FFG IB');

      return [
        calcSimulation(saName, 'TTI IH', m1.target, m1.achievement, m1.comply + m1.notcomply, m1.comply),
        calcSimulation(saName, 'FFG IH', m2.target, m2.achievement, m2.comply + m2.notcomply, m2.comply),
        calcSimulation(saName, 'TTI IB', m3.target, m3.achievement, m3.comply + m3.notcomply, m3.comply),
        calcSimulation(saName, 'FFG IB', m4.target, m4.achievement, m4.comply + m4.notcomply, m4.comply),
        calcGaransiSim(saName, 'GARANSI IH', KPI_TARGET["GARANSI_IH"], g1.achievement, g1.totalPS, g1.totalTicket),
        calcGaransiSim(saName, 'GARANSI IB', KPI_TARGET["GARANSI_IB"], g2.achievement, g2.totalPS, g2.totalTicket),
      ];
    };

    let kpiSimulation: KPISimulation[] = [];
    for (const sa of allSAs) {
      kpiSimulation = kpiSimulation.concat(generateSimulations(sa, sa));
    }
    const branchBogor = generateSimulations("", "BOGOR");
    const branchBogorIncludeBanten = generateSimulations("", "BOGOR (Include Banten)");

    const ttiTickets = internalTti as TTITicket[];
    const ffgTickets = internalFfg as FFGTicket[];

    return {
      summary,
      rankingSA,
      rankingSTO,
      ttiTickets,
      ffgTickets,
      saldoPspiTickets,
      unspecTickets,
      kpiSimulation,
      resume,
      branchBogor,
      branchBogorIncludeBanten
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch dashboard data"
    );
  }
}
