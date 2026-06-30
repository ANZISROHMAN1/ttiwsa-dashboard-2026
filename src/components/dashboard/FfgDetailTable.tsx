"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { FFGTicket } from "@/types/dashboard";
import { Search } from "lucide-react";
import { createPortal } from "react-dom";

interface FfgDetailTableProps {
  tickets: FFGTicket[];
}

export function FfgDetailTable({ tickets }: FfgDetailTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showOnlyNeedUpdate, setShowOnlyNeedUpdate] = useState(false);
  const [previewEvidence, setPreviewEvidence] = useState<string | null>(null);

  // Helper to convert GDrive links to preview iframe URL
  const getDrivePreviewUrl = (url: string) => {
    let id = "";
    const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD) id = matchD[1];
    else {
      const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId) id = matchId[1];
    }
    if (id) return `https://drive.google.com/file/d/${id}/preview`;
    return url;
  };

  // Filtering
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        search === "" ||
        t.SA?.toUpperCase().includes(search.toUpperCase()) ||
        t.STO?.toUpperCase().includes(search.toUpperCase()) ||
        t.SC?.toUpperCase().includes(search.toUpperCase()) ||
        t.SYMTOM?.toUpperCase().includes(search.toUpperCase());

      const matchesStatus = !status || t.STATUS === status;
      const matchesNeedUpdate = !showOnlyNeedUpdate || t.NULL_GDOC;

      return matchSearch && matchesStatus && matchesNeedUpdate;
    });
  }, [tickets, search, status, showOnlyNeedUpdate]);

  // Analysis computations
  const { topSto, topSymptom, nullGdocRank, total } = useMemo(() => {
    const stoCount: Record<string, number> = {};
    const symCount: Record<string, number> = {};
    const nullGdocPerSA: Record<string, number> = {};

    filteredTickets.forEach((t) => {
      const sa = t.SA || "UNKNOWN";
      const sto = t.STO || "UNKNOWN";
      const symptom = t.SYMTOM || "UNKNOWN";

      if (t.NULL_GDOC) {
        nullGdocPerSA[sa] = (nullGdocPerSA[sa] || 0) + 1;
      }
      stoCount[sto] = (stoCount[sto] || 0) + 1;
      symCount[symptom] = (symCount[symptom] || 0) + 1;
    });

    const sortedStos = Object.entries(stoCount).sort((a, b) => b[1] - a[1]);
    const sortedSyms = Object.entries(symCount).sort((a, b) => b[1] - a[1]);
    const sortedNullGdocs = Object.entries(nullGdocPerSA).sort(
      (a, b) => b[1] - a[1]
    );

    return {
      total: filteredTickets.length,
      topSto: sortedStos[0] || ["-", 0],
      topSymptom: sortedSyms[0] || ["-", 0],
      nullGdocRank: sortedNullGdocs,
    };
  }, [filteredTickets]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-foreground">FFG DETAIL (COMP + NOTC)</h2>
          <div className="text-sm md:text-right text-foreground-muted bg-[var(--surface-hover)] p-3 rounded-xl border border-[var(--border)]">
            <div>
              <span className="font-semibold text-foreground">Total Ticket:</span> {total}
            </div>
            <div>
              <span className="font-semibold text-foreground">Top STO:</span> {topSto[0]}
            </div>
            <div>
              <span className="font-semibold text-foreground">Top Symptom:</span> {topSymptom[0]}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              className="form-input pl-10 w-full"
              placeholder="Search SA / STO / SC / Reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="md:w-48">
            <select
              className="form-select w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">ALL STATUS</option>
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
              Showing: <span className="ml-1 font-mono">{filteredTickets.length}</span>
            </Badge>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mb-6 text-sm text-foreground">
          <p className="font-bold text-amber-500 text-lg mb-2">Analisa FFG</p>
          <p className="mb-3">
            Total ticket <strong className="text-foreground">FFG</strong> saat ini sebanyak{" "}
            <strong className="text-foreground">{total}</strong> ticket. STO dengan jumlah ticket tertinggi adalah{" "}
            <strong className="text-foreground">{topSto[0]}</strong>. Symptom yang paling dominan adalah{" "}
            <strong className="text-foreground">{topSymptom[0]}</strong> sebanyak{" "}
            <strong className="text-foreground">{topSymptom[1]}</strong> kasus.
          </p>

          <hr className="border-amber-500/20 my-4" />

          <p className="font-bold text-amber-500 mb-2">BELUM UPDATE REASON PER SA</p>
          <ul className="list-disc pl-5 mb-4 space-y-1 text-foreground-muted">
            {nullGdocRank.length > 0 ? (
              nullGdocRank.map(([sa, count]) => (
                <li key={sa}>
                  <strong className="text-foreground">{sa}</strong> : {count} ticket
                </li>
              ))
            ) : (
              <li>Tidak ada ticket dengan Null GDOC</li>
            )}
          </ul>

          <p className="font-bold text-amber-500 mb-2">Rekomendasi:</p>
          <ul className="list-disc pl-5 text-foreground-muted space-y-1">
            <li>Monitoring ticket aging secara berkala</li>
            <li>Validasi evidence teknisi lapangan</li>
            <li>Pemeriksaan root cause symptom dominan</li>
            <li>Kontrol kualitas jaringan OLT/ODP</li>
          </ul>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-foreground-muted">
                <th className="px-5 py-3 font-medium whitespace-nowrap">SA</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">STO</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">SC</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">STATUS</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">SYMTOM</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">REASON</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">EVIDENT</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">DURASI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {filteredTickets.map((t, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">{t.SA}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{t.STO}</td>
                  <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{t.SC}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <Badge variant={t.STATUS === "TTR-COMP" ? "default" : "danger"}>
                      {t.STATUS}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 min-w-[200px]">
                    {t.NULL_GDOC ? (
                      <Link
                        href={`/submit?sc=${encodeURIComponent(t.SC)}&sto=${encodeURIComponent(t.STO)}&item=${encodeURIComponent('FFG atau TTR FFG NOT COMPLY')}`}
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
                      <button
                        onClick={() => setPreviewEvidence(t.EVIDENT)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        Lihat foto
                      </button>
                    ) : (
                      <span className="text-foreground-muted truncate block max-w-[200px]">
                        {t.EVIDENT}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-mono">{t.DURASI}</td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
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

      {/* Evidence Preview Modal */}
      {previewEvidence && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewEvidence(null)}>
          <div 
            className="relative bg-[var(--surface)] rounded-xl shadow-2xl p-4 w-full max-w-4xl h-[85vh] flex flex-col border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground text-lg">Evidence Preview</h3>
              <button 
                onClick={() => setPreviewEvidence(null)}
                className="p-2 hover:bg-[var(--surface-hover)] rounded-lg text-foreground-muted hover:text-foreground transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <iframe 
              src={getDrivePreviewUrl(previewEvidence)} 
              className="w-full flex-1 rounded-lg border border-[var(--border)] bg-white"
              allow="autoplay"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
