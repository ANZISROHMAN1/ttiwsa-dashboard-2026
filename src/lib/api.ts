import { API_BASE_URL, SALDO_PSPI_API_URL, UNSPEC_API_URL, KPI_TARGET } from "./constants";
import type { DashboardData, SaldoPspiTicket, UnspecTicket, KPISimulation, TTITicket, FFGTicket, RankingSA, RankingSTO, DashboardSummary, Resume } from "@/types/dashboard";

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

// ─── Fetch Dashboard Data ───────────────────────────────────────────────────

export async function fetchDashboardData(
  signal?: AbortSignal
): Promise<DashboardData> {
  try {
    if (!API_BASE_URL || !SALDO_PSPI_API_URL || !UNSPEC_API_URL) {
      throw new ApiError(
        "API URLs are not configured. Please ensure NEXT_PUBLIC_TTIWSA_API_URL, NEXT_PUBLIC_PSPI_API_URL, and UNSPEC_API_URL are set in your environment variables.",
        500
      );
    }

    const [response, saldoResponse, unspecResponse] = await Promise.all([
      fetch(API_BASE_URL, {
        signal,
        next: { revalidate: 0 },
      }),
      fetch(SALDO_PSPI_API_URL, {
        signal,
        next: { revalidate: 0 },
      }),
      fetch(UNSPEC_API_URL, {
        signal,
        next: { revalidate: 0 },
      })
    ]);

    if (!response.ok) {
      throw new ApiError(`API returned ${response.status}: ${response.statusText}`, response.status);
    }
    
    if (!saldoResponse.ok) {
      console.error(`Saldo API returned ${saldoResponse.status}: ${saldoResponse.statusText}`);
    }

    if (!unspecResponse.ok) {
      console.error(`Unspec API returned ${unspecResponse.status}: ${unspecResponse.statusText}`);
    }

    const rawData = await response.json();
    
    let saldoPspiTickets: SaldoPspiTicket[] = [];
    if (saldoResponse.ok) {
      saldoPspiTickets = await saldoResponse.json();
    }

    let unspecTickets: UnspecTicket[] = [];
    if (unspecResponse.ok) {
      unspecTickets = await unspecResponse.json();
    }

    const internalTti: (TTITicket & { kpi: string })[] = [];
    const internalFfg: (FFGTicket & { kpi: string })[] = [];
    const psIhList: { sa: string; sto: string; jml: number }[] = [];
    const psIbList: { sa: string; sto: string; jml: number }[] = [];
    
    let totalNullGdoc = 0;
    let ti_ih_notc = 0;
    let ti_ib_notc = 0;
    let ffg_ih_comp = 0;
    let ffg_ih_notc = 0;
    let ffg_ib_comp = 0;
    let ffg_ib_notc = 0;

    for (const row of rawData) {
      if (row['SC-TTI-IH']) {
        const isNullGdoc = row['SYMTOM-TTI-IH']?.trim() === 'NULL GDOC' || row['REASON-TTI-IH']?.trim() === 'NULL GDOC';
        if (isNullGdoc) totalNullGdoc++;
        if (row['STATUS-TTI-IH'] === 'TTI-NOTC') ti_ih_notc++;
        internalTti.push({
          SA: row['SA-TTI-IH'], STO: row['STO-TTI-IH'], SC: row['SC-TTI-IH'],
          STATUS: row['STATUS-TTI-IH'] as any, SYMTOM: row['SYMTOM-TTI-IH']?.trim(),
          NULL_GDOC: isNullGdoc,
          REASON: row['REASON-TTI-IH'], EVIDENT: row['EVIDENT-TTI-IH'], DURASI: row['DURASI-TTI-IH'],
          kpi: 'TTI IH'
        });
      }
      if (row['SC-FFG-IH']) {
        const isNullGdoc = row['SYMTOM-FFG-IH']?.trim() === 'NULL GDOC' || row['REASON-FFG-IH']?.trim() === 'NULL GDOC';
        if (isNullGdoc) totalNullGdoc++;
        if (row['STATUS-FFG-IH'] === 'TTR-COMP') ffg_ih_comp++;
        if (row['STATUS-FFG-IH'] === 'TTR-NOTC') ffg_ih_notc++;
        internalFfg.push({
          SA: row['SA-FFG-IH'], STO: row['STO-FFG-IH'], SC: row['SC-FFG-IH'],
          STATUS: row['STATUS-FFG-IH'] as any, SYMTOM: row['SYMTOM-FFG-IH']?.trim(),
          NULL_GDOC: isNullGdoc,
          REASON: row['REASON-FFG-IH'], EVIDENT: row['EVIDENT-FFG-IH'], DURASI: row['DURASI-FFG-IH'],
          kpi: 'FFG IH'
        });
      }
      if (row['SC-TTI-IB']) {
        const isNullGdoc = row['SYMTOM-TTI-IB']?.trim() === 'NULL GDOC' || row['REASON-TTI-IB']?.trim() === 'NULL GDOC';
        if (isNullGdoc) totalNullGdoc++;
        if (row['STATUS-TTI-IB'] === 'TTI-NOTC') ti_ib_notc++;
        internalTti.push({
          SA: row['SA-TTI-IB'], STO: row['STO-TTI-IB'], SC: row['SC-TTI-IB'],
          STATUS: row['STATUS-TTI-IB'] as any, SYMTOM: row['SYMTOM-TTI-IB']?.trim(),
          NULL_GDOC: isNullGdoc,
          REASON: row['REASON-TTI-IB'], EVIDENT: row['EVIDENT-TTI-IB'], DURASI: row['DURASI-TTI-IB'],
          kpi: 'TTI IB'
        });
      }
      if (row['SC-FFG-IB']) {
        const isNullGdoc = row['SYMTOM-FFG-IB']?.trim() === 'NULL GDOC' || row['REASON-FFG-IB']?.trim() === 'NULL GDOC';
        if (isNullGdoc) totalNullGdoc++;
        if (row['STATUS-FFG-IB'] === 'TTR-COMP') ffg_ib_comp++;
        if (row['STATUS-FFG-IB'] === 'TTR-NOTC') ffg_ib_notc++;
        internalFfg.push({
          SA: row['SA-FFG-IB'], STO: row['STO-FFG-IB'], SC: row['SC-FFG-IB'],
          STATUS: row['STATUS-FFG-IB'] as any, SYMTOM: row['SYMTOM-FFG-IB']?.trim(),
          NULL_GDOC: isNullGdoc,
          REASON: row['REASON-FFG-IB'], EVIDENT: row['EVIDENT-FFG-IB'], DURASI: row['DURASI-FFG-IB'],
          kpi: 'FFG IB'
        });
      }
      if (row['PS-SA-IH']) {
        psIhList.push({ sa: row['PS-SA-IH'], sto: row['PS-STO-IH'], jml: Number(row['Jml PS-IH']) || 0 });
      }
      if (row['PS-SA-IB']) {
        psIbList.push({ sa: row['PS-SA-IB'], sto: row['PS-STO-IB'], jml: Number(row['Jml PS-IB']) || 0 });
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

    const allSAs = Array.from(new Set([
      ...internalTti.map(t => t.SA), ...internalFfg.map(t => t.SA),
      ...psIhList.map(p => p.sa), ...psIbList.map(p => p.sa)
    ])).filter(Boolean);

    const rankingSA: RankingSA[] = allSAs.map(sa => {
      const ttiIh = getMetric(internalTti.filter(t => t.SA === sa), 'TTI IH', KPI_TARGET["TTI_IH"]).achievement;
      const ffgIh = getMetric(internalFfg.filter(t => t.SA === sa), 'FFG IH', KPI_TARGET["FFG_IH"]).achievement;
      const ttiIb = getMetric(internalTti.filter(t => t.SA === sa), 'TTI IB', KPI_TARGET["TTI_IB"]).achievement;
      const ffgIb = getMetric(internalFfg.filter(t => t.SA === sa), 'FFG IB', KPI_TARGET["FFG_IB"]).achievement;
      const garansiIh = getGaransi(psIhList.filter(p => p.sa === sa), internalFfg.filter(t => t.SA === sa), 'FFG IH').achievement;
      const garansiIb = getGaransi(psIbList.filter(p => p.sa === sa), internalFfg.filter(t => t.SA === sa), 'FFG IB').achievement;
      const achievement = (ttiIh + ffgIh + ttiIb + ffgIb + garansiIh + garansiIb) / 6;
      return { sa, achievement, ttiIH: ttiIh, ffgIH: ffgIh, garansiIH: garansiIh, ttiIB: ttiIb, ffgIB: ffgIb, garansiIB: garansiIb };
    }).sort((a, b) => b.achievement - a.achievement);

    const allSTOs = Array.from(new Set([
      ...internalTti.map(t => t.STO), ...internalFfg.map(t => t.STO),
      ...psIhList.map(p => p.sto), ...psIbList.map(p => p.sto)
    ])).filter(Boolean);

    const rankingSTO: RankingSTO[] = allSTOs.map(sto => {
      const ttiIh = getMetric(internalTti.filter(t => t.STO === sto), 'TTI IH', KPI_TARGET["TTI_IH"]).achievement;
      const ffgIh = getMetric(internalFfg.filter(t => t.STO === sto), 'FFG IH', KPI_TARGET["FFG_IH"]).achievement;
      const ttiIb = getMetric(internalTti.filter(t => t.STO === sto), 'TTI IB', KPI_TARGET["TTI_IB"]).achievement;
      const ffgIb = getMetric(internalFfg.filter(t => t.STO === sto), 'FFG IB', KPI_TARGET["FFG_IB"]).achievement;
      const garansiIh = getGaransi(psIhList.filter(p => p.sto === sto), internalFfg.filter(t => t.STO === sto), 'FFG IH').achievement;
      const garansiIb = getGaransi(psIbList.filter(p => p.sto === sto), internalFfg.filter(t => t.STO === sto), 'FFG IB').achievement;
      const achievement = (ttiIh + ffgIh + ttiIb + ffgIb + garansiIh + garansiIb) / 6;
      return { sto, achievement, ttiIH: ttiIh, ffgIH: ffgIh, garansiIH: garansiIh, ttiIB: ttiIb, ffgIB: ffgIb, garansiIB: garansiIb };
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
