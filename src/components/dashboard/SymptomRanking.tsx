"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { BarChart } from "@/components/ui/BarChart";
import { PieChart } from "@/components/ui/PieChart";
import { Histogram } from "@/components/ui/Histogram";
import { EvidenceModal } from "@/components/ui/EvidenceModal";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { aggregateSymptomsBySA, getUniqueServiceAreas, formatPercent } from "@/lib/utils";
import { KPI_SIM_LABELS } from "@/lib/constants";
import type { Ticket, KPISimulation, SaldoPspiTicket, UnspecTicket } from "@/types/dashboard";
import { CheckCircle2, AlertCircle, ChevronRight, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

type SymptomTab = "tti-ffg" | "pspi" | "unspec";

interface KpiAnalysisProps {
  tickets: Ticket[];
  kpiSimulation: KPISimulation[];
  branchBogor: KPISimulation[];
  saldoPspiTickets?: SaldoPspiTicket[];
  unspecTickets?: UnspecTicket[];
}

export function KpiAnalysis({ tickets, kpiSimulation, branchBogor, saldoPspiTickets = [], unspecTickets = [] }: KpiAnalysisProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const uniqueSAs = useMemo(() => getUniqueServiceAreas(tickets), [tickets]);
  const [selectedSA, setSelectedSA] = useState<string>("BRANCH BOGOR");
  const [selectedKpiCard, setSelectedKpiCard] = useState<string | null>(null);

  // Drill-down state: which symptom is currently "opened"
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  // Search within drill-down detail view
  const [detailSearch, setDetailSearch] = useState("");
  const [detailStatus, setDetailStatus] = useState("");
  const [showOnlyNeedUpdate, setShowOnlyNeedUpdate] = useState(false);
  // Global search for the main view
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalShowOnlyNeedUpdate, setGlobalShowOnlyNeedUpdate] = useState(false);
  // Evidence preview modal
  const [previewEvidence, setPreviewEvidence] = useState<string[] | null>(null);
  // Symptom breakdown tab state
  const [symptomTab, setSymptomTab] = useState<SymptomTab>("tti-ffg");
  // Track which drill-down type is active
  const [drillDownType, setDrillDownType] = useState<SymptomTab>("tti-ffg");
  // PSPI/Unspec drill-down search
  const [pspiUnspecSearch, setPspiUnspecSearch] = useState("");
  // Telegram sending state
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  const handleSendTelegram = async () => {
    try {
      setIsSendingTelegram(true);
      const res = await fetch("/api/telegram/send-manual", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to send");
      alert("Manual report sent to Telegram!");
    } catch (err) {
      console.error(err);
      alert("Error sending report to Telegram");
    } finally {
      setIsSendingTelegram(false);
    }
  };



  const filteredTickets = useMemo(() => {
    let base = tickets;
    
    if (selectedKpiCard) {
      base = base.filter((t) => {
        // Map the display label back to the internal kpi key
        const reverseLabels: Record<string, string> = {
          "TTI 3x24 Indihome": "TTI IH",
          "TTR FFG Indihome": "FFG IH",
          "FFG Indihome": "GARANSI IH",
          "TTI 1x24 Indibiz": "TTI IB",
          "TTR FFG Indibiz": "FFG IB",
          "FFG Indibiz": "GARANSI IB",
          "Ticket yang sudah UPDATE": "UPDATED"
        };
        
        const internalKpi = reverseLabels[selectedKpiCard] || selectedKpiCard;
        let expectedKpi = internalKpi;
        if (internalKpi === "GARANSI IH") expectedKpi = "FFG IH";
        if (internalKpi === "GARANSI IB") expectedKpi = "FFG IB";
        
        // If data is fresh and has the exact KPI tag, use it.
        if (t.kpi) {
          return t.kpi === expectedKpi;
        }

        // Fallback: If browser is still using cached data without the `kpi` field.
        const isExpectedFFG = expectedKpi.includes("FFG");
        const isFFGTicket = t.SYMTOM?.includes("[FFG]") || t.STATUS.startsWith("TTR-");
        
        if (isExpectedFFG) {
          return isFFGTicket;
        } else {
          return !isFFGTicket;
        }
      });
    }

    if (globalSearch) {
      const q = globalSearch.toUpperCase();
      base = base.filter(
        (t) =>
          t.SA?.toUpperCase().includes(q) ||
          t.STO?.toUpperCase().includes(q) ||
          t.SC?.toUpperCase().includes(q) ||
          t.SYMTOM?.toUpperCase().includes(q) ||
          t.REASON?.toUpperCase().includes(q)
      );
    }

    if (globalShowOnlyNeedUpdate) {
      base = base.filter((t) => t.NULL_GDOC);
    }

    return base;
  }, [tickets, selectedKpiCard, globalSearch, globalShowOnlyNeedUpdate]);

  const symptomsBySA = useMemo(() => aggregateSymptomsBySA(filteredTickets, globalShowOnlyNeedUpdate), [filteredTickets, globalShowOnlyNeedUpdate]);

  // Find symptom data for the selected SA (or aggregate all if Branch Bogor)
  const selectedSymptomData = useMemo(() => {
    if (selectedSA === "BRANCH BOGOR") {
      const aggregated = new Map<string, { symptom: string; total: number; comp: number; nonc: number }>();
      let totalTickets = 0;
      let totalComp = 0;
      let totalNonc = 0;

      symptomsBySA.forEach((saData) => {
        totalTickets += saData.totalTickets;
        totalComp += saData.totalComp;
        totalNonc += saData.totalNonc;
        saData.symptoms.forEach((s) => {
          const ex = aggregated.get(s.symptom);
          if (ex) {
            ex.total += s.total;
            ex.comp += s.comp;
            ex.nonc += s.nonc;
          } else {
            aggregated.set(s.symptom, { ...s });
          }
        });
      });

      return {
        sa: "BRANCH BOGOR",
        totalTickets,
        totalComp,
        totalNonc,
        symptoms: Array.from(aggregated.values()).sort((a, b) => b.total - a.total),
      };
    }

    return (
      symptomsBySA.find((s) => s.sa === selectedSA) || {
        sa: selectedSA,
        totalTickets: 0,
        totalComp: 0,
        totalNonc: 0,
        symptoms: [],
      }
    );
  }, [selectedSA, symptomsBySA]);

  // Find KPI simulations for the selected SA
  const selectedSimulation = useMemo(() => {
    let sims = [];
    if (selectedSA === "BRANCH BOGOR") {
      sims = branchBogor;
    } else {
      sims = kpiSimulation.filter((s) => s.sa === selectedSA);
    }
    
    return [...sims].sort((a, b) => {
      const aLabel = KPI_SIM_LABELS[a.kpi] || a.kpi;
      const bLabel = KPI_SIM_LABELS[b.kpi] || b.kpi;
      const aIsIndihome = aLabel.toLowerCase().includes("indihome");
      const bIsIndihome = bLabel.toLowerCase().includes("indihome");
      if (aIsIndihome && !bIsIndihome) return -1;
      if (!aIsIndihome && bIsIndihome) return 1;
      return 0;
    });
  }, [selectedSA, kpiSimulation, branchBogor]);

  // --- Drill-down: get raw tickets for the selected symptom ---
  const drillDownTickets = useMemo(() => {
    if (!selectedSymptom) return [];

    let base = filteredTickets;

    // Also filter by SA if not "BRANCH BOGOR"
    if (selectedSA !== "BRANCH BOGOR") {
      base = base.filter((t) => t.SA === selectedSA);
    }

    // Filter by symptom
    if (selectedSymptom === "UPDATE REASON") {
      base = base.filter((t) => t.NULL_GDOC || t.SYMTOM === "NULL GDOC" || t.SYMTOM === "UPDATE REASON");
    } else {
      base = base.filter((t) => t.SYMTOM === selectedSymptom);
    }

    // Apply search and status filters
    if (detailSearch) {
      const q = detailSearch.toUpperCase();
      base = base.filter(
        (t) =>
          t.SA?.toUpperCase().includes(q) ||
          t.STO?.toUpperCase().includes(q) ||
          t.SC?.toUpperCase().includes(q) ||
          t.SYMTOM?.toUpperCase().includes(q) ||
          t.REASON?.toUpperCase().includes(q)
      );
    }
    if (detailStatus) {
      base = base.filter((t) => t.STATUS === detailStatus);
    }
    if (showOnlyNeedUpdate) {
      base = base.filter((t) => t.NULL_GDOC);
    }

    return base;
  }, [selectedSymptom, filteredTickets, selectedSA, detailSearch, detailStatus, showOnlyNeedUpdate]);

  // Drill-down analysis
  const drillDownAnalysis = useMemo(() => {
    if (!selectedSymptom) return null;
    
    // Use unfiltered (no search/status) tickets for analysis
    let base = filteredTickets;
    if (selectedSA !== "BRANCH BOGOR") {
      base = base.filter((t) => t.SA === selectedSA);
    }
    
    if (selectedSymptom === "UPDATE REASON") {
      base = base.filter((t) => t.NULL_GDOC || t.SYMTOM === "NULL GDOC" || t.SYMTOM === "UPDATE REASON");
    } else {
      base = base.filter((t) => t.SYMTOM === selectedSymptom);
    }

    const stoCount: Record<string, number> = {};
    const nullGdocPerSA: Record<string, number> = {};

    base.forEach((t) => {
      const sto = t.STO || "UNKNOWN";
      stoCount[sto] = (stoCount[sto] || 0) + 1;
      if (t.NULL_GDOC) {
        const sa = t.SA || "UNKNOWN";
        nullGdocPerSA[sa] = (nullGdocPerSA[sa] || 0) + 1;
      }
    });

    const sortedStos = Object.entries(stoCount).sort((a, b) => b[1] - a[1]);
    const sortedNullGdocs = Object.entries(nullGdocPerSA).sort((a, b) => b[1] - a[1]);

    return {
      total: base.length,
      comp: base.filter((t) => t.STATUS.includes("-COMP")).length,
      nonc: base.filter((t) => t.STATUS.includes("-NOTC")).length,
      topSto: sortedStos[0] || ["-", 0],
      nullGdocRank: sortedNullGdocs,
    };
  }, [selectedSymptom, filteredTickets, selectedSA]);

  // Handle clicking a symptom row
  const handleSymptomClick = (symptom: string, type: SymptomTab = "tti-ffg") => {
    setSelectedSymptom(symptom);
    setDrillDownType(type);
    setDetailSearch("");
    setDetailStatus("");
    setPspiUnspecSearch("");
  };

  // Handle going back
  const handleBack = () => {
    setSelectedSymptom(null);
    setDrillDownType("tti-ffg");
    setDetailSearch("");
    setDetailStatus("");
    setShowOnlyNeedUpdate(false);
    setPspiUnspecSearch("");
  };
  
  const handleUpdateClick = (t: Ticket, status: "ACCEPT" | "REJECT") => {
    const item = t.STATUS.startsWith('TTI') ? 'TTI NOT COMPLY' : 'FFG atau TTR FFG NOT COMPLY';
    router.push(`/submit/not-comply?sc=${encodeURIComponent(t.SC)}&sto=${encodeURIComponent(t.STO)}&item=${encodeURIComponent(item)}&evidenceStatus=${status}`);
  };

  // --- PSPI front tickets ---
  const pspiFrontTickets = useMemo(() => {
    let base = saldoPspiTickets;
    if (selectedSA !== "BRANCH BOGOR") {
      base = base.filter((t) => t.SA === selectedSA);
    }
    if (globalSearch) {
      const q = globalSearch.toUpperCase();
      base = base.filter((t) =>
        t.SA?.toUpperCase().includes(q) ||
        t.sto?.toUpperCase().includes(q) ||
        t.sc_orderid?.toUpperCase().includes(q) ||
        String(t.nd || "").toUpperCase().includes(q) ||
        t.last_status?.toUpperCase().includes(q) ||
        t.KETERANGAN?.toUpperCase().includes(q)
      );
    }
    return base;
  }, [saldoPspiTickets, selectedSA, globalSearch]);

  // --- Unspec front tickets ---
  const unspecFrontTickets = useMemo(() => {
    let base = unspecTickets;
    if (selectedSA !== "BRANCH BOGOR") {
      base = base.filter((t) => t.SA === selectedSA);
    }
    if (globalSearch) {
      const q = globalSearch.toUpperCase();
      base = base.filter((t) =>
        t.SA?.toUpperCase().includes(q) ||
        t.sto?.toUpperCase().includes(q) ||
        t.sc_orderid?.toUpperCase().includes(q) ||
        String(t.nd_speedy)?.toUpperCase().includes(q)
      );
    }
    return base;
  }, [unspecTickets, selectedSA, globalSearch]);


  // ====== TTI/FFG DRILL-DOWN VIEW (detail tickets for a specific symptom) ======
  if (selectedSymptom && drillDownAnalysis) {
    // Determine available statuses for the filter
    const statusOptions = new Set(drillDownTickets.map((t) => t.STATUS));

    return (
      <div className="space-y-5 animate-fade-in">
        {/* Breadcrumb */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-accent-blue hover:text-blue-400 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-foreground-muted">|</span>
            <button
              onClick={handleBack}
              className="text-accent-blue hover:text-blue-400 transition-colors font-medium"
            >
              KPI Analysis
            </button>
            <ChevronRight className="w-4 h-4 text-foreground-muted" />
            {selectedSA !== "BRANCH BOGOR" && (
              <>
                <button
                  onClick={handleBack}
                  className="text-accent-blue hover:text-blue-400 transition-colors font-medium"
                >
                  {selectedSA}
                </button>
                <ChevronRight className="w-4 h-4 text-foreground-muted" />
              </>
            )}
            <span className="text-foreground font-semibold truncate">{selectedSymptom}</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card-sm p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{drillDownAnalysis.total}</div>
            <div className="text-xs text-foreground-muted mt-1">Total Tickets</div>
          </div>
          <div className="glass-card-sm p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{drillDownAnalysis.comp}</div>
            <div className="text-xs text-foreground-muted mt-1">COMP</div>
          </div>
          <div className="glass-card-sm p-4 text-center">
            <div className="text-2xl font-bold text-rose-400">{drillDownAnalysis.nonc}</div>
            <div className="text-xs text-foreground-muted mt-1">NOTC</div>
          </div>
          <div className="glass-card-sm p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{drillDownAnalysis.topSto[0]}</div>
            <div className="text-xs text-foreground-muted mt-1">Top STO</div>
          </div>
        </div>

        {/* Analysis Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 text-sm text-foreground">
          <p className="font-bold text-accent-blue text-lg mb-2">
            Analisa: {selectedSymptom}
          </p>
          <p className="mb-3">
            Total ticket dengan symptom <strong>{selectedSymptom}</strong> saat ini sebanyak{" "}
            <strong>{drillDownAnalysis.total}</strong> ticket.{" "}
            STO dengan jumlah ticket tertinggi adalah{" "}
            <strong>{drillDownAnalysis.topSto[0]}</strong> ({drillDownAnalysis.topSto[1]} ticket).
          </p>

          {drillDownAnalysis.nullGdocRank.length > 0 && (
            <>
              <hr className="border-blue-500/20 my-4" />
              <p className="font-bold text-amber-500 mb-2">BELUM UPDATE REASON PER SA</p>
              <ul className="list-disc pl-5 mb-4 space-y-1 text-foreground-muted">
                {drillDownAnalysis.nullGdocRank.map(([sa, count]) => (
                  <li key={sa}>
                    <strong className="text-foreground">{sa}</strong> : {count} ticket
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="text"
                className="form-input pl-10 w-full"
                placeholder="Search SA / STO / SC / Reason..."
                value={detailSearch}
                onChange={(e) => setDetailSearch(e.target.value)}
              />
            </div>
            <div className="md:w-48">
              <select
                className="form-select w-full"
                value={detailStatus}
                onChange={(e) => setDetailStatus(e.target.value)}
              >
                <option value="">ALL STATUS</option>
                <option value="TTI-COMP">TTI-COMP</option>
                <option value="TTI-NOTC">TTI-NOTC</option>
                <option value="TTR-COMP">TTR-COMP</option>
                <option value="TTR-NOTC">TTR-NOTC</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground bg-[var(--surface-hover)] px-3 py-2 rounded-lg border border-[var(--border)] transition-colors hover:bg-[var(--border)]">
                <input
                  type="checkbox"
                  checked={showOnlyNeedUpdate}
                  onChange={(e) => setShowOnlyNeedUpdate(e.target.checked)}
                  className="w-4 h-4 text-amber-500 bg-background border-[var(--border)] rounded focus:ring-amber-500"
                />
                Need Update Reason
              </label>
              <Badge variant="info" className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm">
                Showing: <span className="ml-1 font-mono">{drillDownTickets.length}</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Detail Ticket Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-foreground-muted">
                  {selectedKpiCard === "Ticket yang sudah UPDATE" ? (
                    <>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">Timestamp</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">STO</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">NOMOR ORDER / NOMOR TIKET INCIDENT</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">NAMA TEKNISI</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">NIK TEKNISI</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">MITRA</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">ITEM NOT COMPLY</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">SYMTOM KENDALA</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">KETERANGAN DETAIL KENDALA</th>
                    </>
                  ) : (
                    <>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">SA</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">STO</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">SC</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">STATUS</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">SYMTOM</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">REASON</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">EVIDENT</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">DURASI</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {drillDownTickets.map((t, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                    {selectedKpiCard === "Ticket yang sudah UPDATE" ? (
                      <>
                        <td className="px-5 py-3 whitespace-nowrap">{t.TIMESTAMP || "-"}</td>
                        <td className="px-5 py-3 whitespace-nowrap">{t.STO}</td>
                        <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t.SC}</td>
                        <td className="px-5 py-3 whitespace-nowrap">{t.NAMA_TEKNISI || "-"}</td>
                        <td className="px-5 py-3 whitespace-nowrap font-mono">{t.NIK_TEKNISI || "-"}</td>
                        <td className="px-5 py-3 whitespace-nowrap">{t.MITRA || "-"}</td>
                        <td className="px-5 py-3 whitespace-nowrap">{t.ITEM_NOT_COMPLY || "-"}</td>
                        <td className="px-5 py-3 min-w-[200px]">{t.SYMTOM || "-"}</td>
                        <td className="px-5 py-3 min-w-[200px] text-foreground-muted">{t.REASON || "-"}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3 whitespace-nowrap">{t.SA}</td>
                        <td className="px-5 py-3 whitespace-nowrap">{t.STO}</td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t.SC}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Badge variant={t.STATUS.includes("-COMP") ? "default" : "danger"}>
                        {t.STATUS}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 min-w-[200px]">
                      {t.NULL_GDOC ? (
                        <Link
                          href={`/submit/not-comply?sc=${encodeURIComponent(t.SC)}&sto=${encodeURIComponent(t.STO)}&item=${encodeURIComponent(t.STATUS.startsWith('TTI') ? 'TTI NOT COMPLY' : 'FFG atau TTR FFG NOT COMPLY')}&symptomKendala=${encodeURIComponent(t.SYMTOM || "")}&keteranganDetail=${encodeURIComponent(t.REASON || "")}&namaTeknisi=${encodeURIComponent(t.NAMA_TEKNISI || "")}&nikTeknisi=${encodeURIComponent(t.NIK_TEKNISI || "")}&mitra=${encodeURIComponent(t.MITRA || "")}`}
                          className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-colors"
                        >
                          UPDATE REASON
                        </Link>
                      ) : (
                        t.SYMTOM
                      )}
                    </td>
                    <td className="px-5 py-3 min-w-[200px] text-foreground-muted">{t.REASON}</td>
                    <td className="px-5 py-3 min-w-[150px]">
                      {t.EVIDENT?.startsWith("http") ? (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setPreviewEvidence([t.EVIDENT, t.EVIDENT2 || '', t.EVIDENT3 || '', t.EVIDENT4 || ''].filter(u => u && u.startsWith('http')))}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            Lihat foto
                          </button>
                          {isLoggedIn && (
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/submit/not-comply?sc=${encodeURIComponent(t.SC)}&sto=${encodeURIComponent(t.STO)}&item=${encodeURIComponent(t.STATUS.startsWith('TTI') ? 'TTI NOT COMPLY' : 'FFG atau TTR FFG NOT COMPLY')}&evidenceStatus=ACCEPT&symptomKendala=${encodeURIComponent(t.SYMTOM || "")}&keteranganDetail=${encodeURIComponent(t.REASON || "")}&evidenceLink=${encodeURIComponent(t.EVIDENT || "")}&namaTeknisi=${encodeURIComponent(t.NAMA_TEKNISI || "")}&nikTeknisi=${encodeURIComponent(t.NIK_TEKNISI || "")}&mitra=${encodeURIComponent(t.MITRA || "")}`}
                                className="flex-1 text-center inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                              >
                                Accept
                              </Link>
                              <Link
                                href={`/submit/not-comply?sc=${encodeURIComponent(t.SC)}&sto=${encodeURIComponent(t.STO)}&item=${encodeURIComponent(t.STATUS.startsWith('TTI') ? 'TTI NOT COMPLY' : 'FFG atau TTR FFG NOT COMPLY')}&evidenceStatus=REJECT&symptomKendala=${encodeURIComponent(t.SYMTOM || "")}&keteranganDetail=${encodeURIComponent(t.REASON || "")}&evidenceLink=${encodeURIComponent(t.EVIDENT || "")}&namaTeknisi=${encodeURIComponent(t.NAMA_TEKNISI || "")}&nikTeknisi=${encodeURIComponent(t.NIK_TEKNISI || "")}&mitra=${encodeURIComponent(t.MITRA || "")}`}
                                className="flex-1 text-center inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                              >
                                Reject
                              </Link>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-foreground-muted truncate block max-w-[200px]">
                          {t.EVIDENT}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono">{t.DURASI}</td>
                      </>
                    )}
                  </tr>
                ))}
                {drillDownTickets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-foreground-muted">
                      Tidak ada ticket yang sesuai dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribution Charts */}
        {drillDownTickets.length > 0 && (() => {
          const compTickets = drillDownTickets.filter((t) => t.STATUS.includes("-COMP"));
          const notcTickets = drillDownTickets.filter((t) => t.STATUS.includes("-NOTC"));

          return (
            <div className="space-y-8 mt-8">
              {compTickets.length > 0 && (
                <div className="animate-fade-in">
                  <h3 className="font-bold text-lg text-emerald-400 border-b border-[var(--border)] pb-2 mb-4">COMPLY (COMP)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-emerald-400">Distribusi SA (Pie)</h3>
                      <PieChart data={(() => {
                        const count: Record<string, number> = {};
                        compTickets.forEach(t => {
                          const sa = t.SA || "UNKNOWN";
                          count[sa] = (count[sa] || 0) + 1;
                        });
                        return Object.fromEntries(Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0, 10));
                      })()} />
                    </div>
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-emerald-400">Distribusi STO (Histogram)</h3>
                      <Histogram data={(() => {
                        const count: Record<string, number> = {};
                        compTickets.forEach(t => {
                          const sto = t.STO || "UNKNOWN";
                          count[sto] = (count[sto] || 0) + 1;
                        });
                        return Object.fromEntries(Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0, 15));
                      })()} color="rgba(16, 185, 129, 0.8)" />
                    </div>
                  </div>
                </div>
              )}

              {notcTickets.length > 0 && (
                <div className="animate-fade-in">
                  <h3 className="font-bold text-lg text-rose-400 border-b border-[var(--border)] pb-2 mb-4">NOT COMPLY (NOTC)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-rose-400">Distribusi SA (Pie)</h3>
                      <PieChart data={(() => {
                        const count: Record<string, number> = {};
                        notcTickets.forEach(t => {
                          const sa = t.SA || "UNKNOWN";
                          count[sa] = (count[sa] || 0) + 1;
                        });
                        return Object.fromEntries(Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0, 10));
                      })()} />
                    </div>
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-rose-400">Distribusi STO (Histogram)</h3>
                      <Histogram data={(() => {
                        const count: Record<string, number> = {};
                        notcTickets.forEach(t => {
                          const sto = t.STO || "UNKNOWN";
                          count[sto] = (count[sto] || 0) + 1;
                        });
                        return Object.fromEntries(Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0, 15));
                      })()} color="rgba(244, 63, 94, 0.8)" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Evidence Preview Modal */}
        {previewEvidence && (
          <EvidenceModal
            evidenceUrls={previewEvidence}
            onClose={() => setPreviewEvidence(null)}
          />
        )}
      </div>
    );
  }

  // ====== MAIN VIEW (KPI cards + symptom list) ======
  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 glass-card p-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">KPI Analysis & Symptoms</h2>
          <p className="text-sm text-foreground-muted">
            Analyze achievement gaps and click a symptom to drill down into ticket details.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              className="form-input pl-10 w-full text-sm"
              placeholder="Search SA / STO / SC / Reason..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>
          <select
            id="sa-filter"
            className="form-input form-select min-w-[180px] w-full sm:w-auto text-sm"
            value={selectedSA}
            onChange={(e) => setSelectedSA(e.target.value)}
          >
            <option value="BRANCH BOGOR">BRANCH BOGOR</option>
            {uniqueSAs.map((sa) => (
              <option key={sa} value={sa}>
                {sa}
              </option>
            ))}
          </select>
          <label className="flex items-center justify-center gap-2 cursor-pointer text-sm font-medium text-foreground bg-[var(--surface-hover)] px-3 py-2 rounded-lg border border-[var(--border)] transition-colors hover:bg-[var(--border)] whitespace-nowrap">
            <input
              type="checkbox"
              checked={globalShowOnlyNeedUpdate}
              onChange={(e) => setGlobalShowOnlyNeedUpdate(e.target.checked)}
              className="w-4 h-4 text-amber-500 bg-background border-[var(--border)] rounded focus:ring-amber-500"
            />
            Need Update
          </label>
          
          {isLoggedIn && (
            <button
              onClick={handleSendTelegram}
              disabled={isSendingTelegram}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm shadow-blue-500/20 whitespace-nowrap disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              {isSendingTelegram ? "Sending..." : "Send Telegram"}
            </button>
          )}
        </div>
      </div>

      {/* KPI Simulation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {selectedSimulation.map((sim, idx) => {
          const isAchieve = sim.status === "ACHIEVE";
          const actualVal = parseFloat(sim.actual);
          const cardLabel = KPI_SIM_LABELS[sim.kpi] || sim.kpi;
          const isSelected = selectedKpiCard === cardLabel;

          return (
            <div
              key={idx}
              onClick={() => setSelectedKpiCard(isSelected ? null : cardLabel)}
              className={`glass-card p-5 border-l-4 cursor-pointer transition-all duration-200 ${
                isAchieve ? "border-l-emerald-500" : "border-l-rose-500"
              } ${isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01]"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-foreground text-sm tracking-wide">
                  {cardLabel}
                </h3>
                {isAchieve ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Actual</div>
                  <div
                    className={`text-2xl font-bold font-mono ${
                      isAchieve ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatPercent(actualVal)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-foreground-muted mb-1">Target</div>
                  <div className="text-lg font-medium font-mono text-foreground">
                    {formatPercent(sim.target)}
                  </div>
                </div>
              </div>
              <div
                className={`text-sm px-3 py-2 rounded-md font-medium ${
                  isAchieve
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {sim.action}
              </div>
            </div>
          );
        })}
        {selectedSimulation.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center text-foreground-muted">
            No KPI simulation data available for this area.
          </div>
        )}
        
        {/* Ticket yang sudah UPDATE Custom Card */}
        <div
          onClick={() => setSelectedKpiCard(selectedKpiCard === "Ticket yang sudah UPDATE" ? null : "Ticket yang sudah UPDATE")}
          className={`glass-card p-5 border-l-4 cursor-pointer transition-all duration-200 border-l-emerald-500 ${selectedKpiCard === "Ticket yang sudah UPDATE" ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01]"}`}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-foreground text-sm tracking-wide">
              Ticket yang sudah UPDATE
            </h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-xs text-foreground-muted mb-1">Total Tickets</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {tickets.filter(t => t.kpi === 'UPDATED').length}
              </div>
            </div>
          </div>
          <div className="text-sm px-3 py-2 rounded-md font-medium bg-emerald-500/10 text-emerald-400">
            TICKETS SUDAH UPDATE
          </div>
        </div>
      </div>

      {/* Symptom Breakdown Tabs + Content */}
      {(() => {
        // --- Aggregate PSPI data by SA ---
        const pspiDataBySA = (() => {
          const saMap = new Map<string, { status: string; total: number }[]>();
          for (const t of saldoPspiTickets) {
            const sa = t.SA || "UNKNOWN";
            const status = t["Status PS/PI"] || t.f_pspi || "UNKNOWN";
            if (!saMap.has(sa)) saMap.set(sa, []);
            const arr = saMap.get(sa)!;
            const existing = arr.find((s) => s.status === status);
            if (existing) existing.total++;
            else arr.push({ status, total: 1 });
          }
          return saMap;
        })();

        const pspiForSelectedSA = (() => {
          if (selectedSA === "BRANCH BOGOR") {
            // Aggregate all SAs
            const merged = new Map<string, number>();
            for (const t of saldoPspiTickets) {
              const status = t["Status PS/PI"] || t.f_pspi || "UNKNOWN";
              merged.set(status, (merged.get(status) || 0) + 1);
            }
            return Array.from(merged.entries())
              .map(([status, total]) => ({ status, total }))
              .sort((a, b) => b.total - a.total);
          }
          return (pspiDataBySA.get(selectedSA) || []).sort((a, b) => b.total - a.total);
        })();

        const pspiTotal = pspiForSelectedSA.reduce((acc, s) => acc + s.total, 0);

        // --- Aggregate Unspec data by SA ---
        const unspecDataBySA = (() => {
          const saMap = new Map<string, { status: string; total: number }[]>();
          for (const t of unspecTickets) {
            const sa = t.SA || "UNKNOWN";
            const status = t.last_status_ukur || "UNKNOWN";
            if (!saMap.has(sa)) saMap.set(sa, []);
            const arr = saMap.get(sa)!;
            const existing = arr.find((s) => s.status === status);
            if (existing) existing.total++;
            else arr.push({ status, total: 1 });
          }
          return saMap;
        })();

        const unspecForSelectedSA = (() => {
          if (selectedSA === "BRANCH BOGOR") {
            const merged = new Map<string, number>();
            for (const t of unspecTickets) {
              const status = t.last_status_ukur || "UNKNOWN";
              merged.set(status, (merged.get(status) || 0) + 1);
            }
            return Array.from(merged.entries())
              .map(([status, total]) => ({ status, total }))
              .sort((a, b) => b.total - a.total);
          }
          return (unspecDataBySA.get(selectedSA) || []).sort((a, b) => b.total - a.total);
        })();

        const unspecTotal = unspecForSelectedSA.reduce((acc, s) => acc + s.total, 0);

        return (
          <>
            {/* Tab Buttons styled as KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div
                onClick={() => setSymptomTab(symptomTab === "pspi" ? "tti-ffg" : "pspi")}
                className={`glass-card p-5 border-l-4 cursor-pointer transition-all duration-200 border-l-rose-500 ${
                  symptomTab === "pspi" ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01]"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-foreground text-sm tracking-wide">
                    PS/PI
                  </h3>
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-xs text-foreground-muted mb-1">Total Tickets</div>
                    <div className="text-2xl font-bold font-mono text-rose-400">
                      {pspiTotal}
                    </div>
                  </div>
                </div>
                <div className="text-xs px-3 py-2 rounded-md font-medium text-center bg-rose-500/10 text-rose-500">
                  MENUNGGU ACTION PS/PI
                </div>
              </div>

              <div
                onClick={() => setSymptomTab(symptomTab === "unspec" ? "tti-ffg" : "unspec")}
                className={`glass-card p-5 border-l-4 cursor-pointer transition-all duration-200 border-l-emerald-500 ${
                  symptomTab === "unspec" ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01]"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-foreground text-sm tracking-wide">
                    UNDERSPEC
                  </h3>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-xs text-foreground-muted mb-1">Total Tickets</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {unspecTotal}
                    </div>
                  </div>
                </div>
                <div className="text-xs px-3 py-2 rounded-md font-medium text-center bg-emerald-500/10 text-emerald-500">
                  TICKETS UNDERSPEC
                </div>
              </div>
            </div>

            {/* Symptoms Detail — clickable rows */}
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-hover)]">
                <h3 className="text-base font-semibold text-foreground">
                  {symptomTab === "pspi" && "PS/PI "}
                  {symptomTab === "unspec" && "UNDERSPEC "}
                  Symptom Breakdown ({selectedSA})
                  {symptomTab === "tti-ffg" && selectedKpiCard && (
                    <span className="ml-2 text-sm font-normal text-primary bg-primary/10 px-2 py-1 rounded-full">
                      Filtered: {selectedKpiCard}
                    </span>
                  )}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {symptomTab === "tti-ffg" && (
                    <>
                      <Badge variant="info">Total: {selectedSymptomData.totalTickets}</Badge>
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        COMP: {selectedSymptomData.totalComp}
                      </Badge>
                      <Badge variant="danger">NONC: {selectedSymptomData.totalNonc}</Badge>
                    </>
                  )}
                  {symptomTab === "pspi" && (
                    <Badge variant="info">Total: {pspiTotal}</Badge>
                  )}
                  {symptomTab === "unspec" && (
                    <Badge variant="info">Total: {unspecTotal}</Badge>
                  )}
                </div>
              </div>

              <div className="px-5 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
                <p className="text-xs text-foreground-muted flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-blue">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Click on a symptom to view detailed tickets
                </p>
              </div>

              <div className="p-0">
                {/* === TTI/FFG Symptom Table === */}
                {symptomTab === "tti-ffg" && (
                   <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-foreground-muted bg-[var(--surface)]">
                        <th className="px-5 py-3 font-medium">Symptom</th>
                        <th className="px-5 py-3 font-medium text-center">Total</th>
                        <th className="px-5 py-3 font-medium text-center">COMP</th>
                        <th className="px-5 py-3 font-medium text-center">NONC</th>
                        <th className="px-5 py-3 font-medium text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-sm">
                      {selectedSymptomData.symptoms.map((s) => (
                        <tr
                          key={s.symptom}
                          onClick={() => handleSymptomClick(s.symptom)}
                          className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-3 font-medium text-foreground group-hover:text-accent-blue transition-colors">
                            {s.symptom}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-mono">{s.total}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {s.comp > 0 ? (
                              <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                {s.comp}
                              </Badge>
                            ) : (
                              <span className="text-foreground-muted font-mono">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {s.nonc > 0 ? (
                              <Badge variant="danger">{s.nonc}</Badge>
                            ) : (
                              <span className="text-foreground-muted font-mono">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-accent-blue transition-colors" />
                          </td>
                        </tr>
                      ))}
                      {selectedSymptomData.symptoms.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-foreground-muted">
                            No tickets found for this area.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* === PS/PI Details === */}
                {symptomTab === "pspi" && (
                  <div className="p-5 bg-[var(--surface)] space-y-6">
                    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-foreground-muted">
                            <th className="px-5 py-3 font-medium whitespace-nowrap">SA</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">STO</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">SC ORDER ID</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">ND</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">STATUS PS/PI</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">LAST STATUS</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">KETERANGAN</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">ERROR CODE</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] text-sm">
                          {pspiFrontTickets.map((t, idx) => (
                            <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="px-5 py-3 whitespace-nowrap">{t.SA}</td>
                              <td className="px-5 py-3 whitespace-nowrap">{t.sto}</td>
                              <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t.sc_orderid}</td>
                              <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t.nd}</td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <Badge variant="info">{t["Status PS/PI"] || t.f_pspi}</Badge>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">{t.last_status}</td>
                              <td className="px-5 py-3 min-w-[200px] text-foreground-muted">{t.KETERANGAN}</td>
                              <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t["ERROR CODE"]}</td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <Link
                                  href={`/submit/ps-pi?sc=${encodeURIComponent(t.sc_orderid)}`}
                                  className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 transition-colors"
                                >
                                  UPDATE DATA
                                </Link>
                              </td>
                            </tr>
                          ))}
                          {pspiFrontTickets.length === 0 && (
                            <tr>
                              <td colSpan={9} className="px-5 py-12 text-center text-foreground-muted">
                                Tidak ada ticket yang sesuai dengan filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Distribution Charts */}
                    {pspiFrontTickets.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="glass-card p-5">
                          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-rose-400">Distribusi SA (Pie)</h3>
                          <PieChart data={(() => {
                            const count: Record<string, number> = {};
                            pspiFrontTickets.forEach(t => {
                              const sa = t.SA || "UNKNOWN";
                              count[sa] = (count[sa] || 0) + 1;
                            });
                            return Object.fromEntries(Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0, 10));
                          })()} />
                        </div>
                        <div className="glass-card p-5">
                          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-rose-400">Distribusi STO (Histogram)</h3>
                          <Histogram data={(() => {
                            const count: Record<string, number> = {};
                            pspiFrontTickets.forEach(t => {
                              const sto = t.sto || "UNKNOWN";
                              count[sto] = (count[sto] || 0) + 1;
                            });
                            return Object.fromEntries(Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0, 15));
                          })()} color="rgba(244, 63, 94, 0.8)" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* === UNDERSPEC Details === */}
                {symptomTab === "unspec" && (
                  <div className="p-5 bg-[var(--surface)] space-y-6">
                    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-foreground-muted">
                            <th className="px-5 py-3 font-medium whitespace-nowrap">SA</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">STO</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">ND</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">SC ORDER ID</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">LAST STATUS UKUR</th>
                            <th className="px-5 py-3 font-medium whitespace-nowrap">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] text-sm">
                          {unspecFrontTickets.map((t, idx) => (
                            <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="px-5 py-3 whitespace-nowrap">{t.SA}</td>
                              <td className="px-5 py-3 whitespace-nowrap">{t.sto}</td>
                              <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t.nd_speedy}</td>
                              <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t.sc_orderid}</td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <Badge variant="info">{t.last_status_ukur}</Badge>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <Link
                                  href={`/submit/unspec?sc=${encodeURIComponent(t.sc_orderid)}`}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                >
                                  UPDATE DATA
                                </Link>
                              </td>
                            </tr>
                          ))}
                          {unspecFrontTickets.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-5 py-12 text-center text-foreground-muted">
                                Tidak ada ticket yang sesuai dengan filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Distribution Charts */}
                    {unspecFrontTickets.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="glass-card p-5">
                          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-emerald-400">Distribusi SA (Pie)</h3>
                          <PieChart data={(() => {
                            const count: Record<string, number> = {};
                            unspecFrontTickets.forEach(t => {
                              const sa = t.SA || "UNKNOWN";
                              count[sa] = (count[sa] || 0) + 1;
                            });
                            return Object.fromEntries(Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0, 10));
                          })()} />
                        </div>
                        <div className="glass-card p-5">
                          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-emerald-400">Distribusi STO (Histogram)</h3>
                          <Histogram data={(() => {
                            const count: Record<string, number> = {};
                            unspecFrontTickets.forEach(t => {
                              const sto = t.sto || "UNKNOWN";
                              count[sto] = (count[sto] || 0) + 1;
                            });
                            return Object.fromEntries(Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0, 15));
                          })()} color="rgba(16, 185, 129, 0.8)" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
