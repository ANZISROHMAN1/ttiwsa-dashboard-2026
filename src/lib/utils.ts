import { THRESHOLD } from "./constants";
import type { Ticket, SymptomAggregate, SymptomBySA } from "@/types/dashboard";

// ─── Number Formatting ──────────────────────────────────────────────────────

/** Format a number as a percentage string (e.g. 96.97 → "96.97%") */
export function formatPercent(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
}

/** Format a number with commas (e.g. 3044 → "3,044") */
export function formatNumber(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return "—";
  return value.toLocaleString("id-ID");
}

/** Format duration in hours (e.g. 74 → "74.00 jam") */
export function formatDuration(value: number | string | undefined): string {
  if (value == null || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return `${num.toFixed(1)}h`;
}

// ─── Color Helpers ──────────────────────────────────────────────────────────

/** Returns a CSS class name based on performance achievement level */
export function getAchievementColor(value: number): string {
  if (value >= THRESHOLD.EXCELLENT) return "text-emerald";
  if (value >= THRESHOLD.GOOD) return "text-amber";
  return "text-rose";
}

/** Returns a CSS class for the background badge variant */
export function getAchievementBg(value: number): string {
  if (value >= THRESHOLD.EXCELLENT) return "bg-emerald";
  if (value >= THRESHOLD.GOOD) return "bg-amber";
  return "bg-rose";
}

/** Returns both text and bg classes */
export function getAchievementClasses(value: number): {
  text: string;
  bg: string;
  ring: string;
} {
  if (value >= THRESHOLD.EXCELLENT)
    return {
      text: "text-emerald-400",
      bg: "bg-emerald-400/10",
      ring: "ring-emerald-400/20",
    };
  if (value >= THRESHOLD.GOOD)
    return {
      text: "text-amber-400",
      bg: "bg-amber-400/10",
      ring: "ring-amber-400/20",
    };
  return {
    text: "text-rose-400",
    bg: "bg-rose-400/10",
    ring: "ring-rose-400/20",
  };
}

// ─── Data Processing ────────────────────────────────────────────────────────

/** Aggregate symptoms from tickets (excluding NULL GDOC by default unless specified) */
export function aggregateSymptoms(tickets: Ticket[], includeNullGdoc: boolean = false): SymptomAggregate[] {
  const map = new Map<string, { total: number; comp: number; nonc: number; serviceAreas: Set<string> }>();

  for (const ticket of tickets) {
    const isNullGdoc = ticket.NULL_GDOC || ticket.SYMTOM === "NULL GDOC";
    if (!includeNullGdoc && isNullGdoc) continue;

    let symptom = ticket.SYMTOM?.trim() || "";
    if (isNullGdoc) symptom = "UPDATE REASON";
    if (!symptom) continue;

    const isComp = ticket.STATUS.includes("-COMP");
    const isNonc = ticket.STATUS.includes("-NOTC");

    const existing = map.get(symptom);
    if (existing) {
      existing.total++;
      if (isComp) existing.comp++;
      if (isNonc) existing.nonc++;
      existing.serviceAreas.add(ticket.SA);
    } else {
      map.set(symptom, {
        total: 1,
        comp: isComp ? 1 : 0,
        nonc: isNonc ? 1 : 0,
        serviceAreas: new Set([ticket.SA]),
      });
    }
  }

  return Array.from(map.entries())
    .map(([symptom, data]) => ({
      symptom,
      total: data.total,
      comp: data.comp,
      nonc: data.nonc,
      serviceAreas: Array.from(data.serviceAreas),
    }))
    .sort((a, b) => b.total - a.total);
}

/** Aggregate symptoms grouped by Service Area */
export function aggregateSymptomsBySA(tickets: Ticket[], includeNullGdoc: boolean = false): SymptomBySA[] {
  const saMap = new Map<
    string,
    { symptoms: Map<string, { total: number; comp: number; nonc: number }>; totalTickets: number; totalComp: number; totalNonc: number }
  >();

  for (const ticket of tickets) {
    const isNullGdoc = ticket.NULL_GDOC || ticket.SYMTOM === "NULL GDOC";
    if (!includeNullGdoc && isNullGdoc) continue;

    let symptom = ticket.SYMTOM?.trim() || "";
    if (isNullGdoc) symptom = "UPDATE REASON";
    if (!symptom) continue;

    const sa = ticket.SA;
    const isComp = ticket.STATUS.includes("-COMP");
    const isNonc = ticket.STATUS.includes("-NOTC");

    const existing = saMap.get(sa);
    if (existing) {
      existing.totalTickets++;
      if (isComp) existing.totalComp++;
      if (isNonc) existing.totalNonc++;

      const symData = existing.symptoms.get(symptom);
      if (symData) {
        symData.total++;
        if (isComp) symData.comp++;
        if (isNonc) symData.nonc++;
      } else {
        existing.symptoms.set(symptom, { total: 1, comp: isComp ? 1 : 0, nonc: isNonc ? 1 : 0 });
      }
    } else {
      const symptoms = new Map<string, { total: number; comp: number; nonc: number }>();
      symptoms.set(symptom, { total: 1, comp: isComp ? 1 : 0, nonc: isNonc ? 1 : 0 });
      saMap.set(sa, { symptoms, totalTickets: 1, totalComp: isComp ? 1 : 0, totalNonc: isNonc ? 1 : 0 });
    }
  }

  return Array.from(saMap.entries())
    .map(([sa, data]) => ({
      sa,
      symptoms: Array.from(data.symptoms.entries())
        .map(([symptom, counts]) => ({ symptom, ...counts }))
        .sort((a, b) => b.total - a.total),
      totalTickets: data.totalTickets,
      totalComp: data.totalComp,
      totalNonc: data.totalNonc,
    }))
    .sort((a, b) => b.totalTickets - a.totalTickets);
}

/** Get unique Service Area names from tickets */
export function getUniqueServiceAreas(tickets: Ticket[]): string[] {
  return Array.from(new Set(tickets.map((t) => t.SA))).sort();
}

/** Get unique STO names from tickets */
export function getUniqueSTOs(tickets: Ticket[]): string[] {
  return Array.from(new Set(tickets.map((t) => t.STO))).sort();
}

// ─── Misc ───────────────────────────────────────────────────────────────────

/** Classnames helper — filters falsy values and joins */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a Date object to a readable timestamp */
export function formatTimestamp(date: Date): string {
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
