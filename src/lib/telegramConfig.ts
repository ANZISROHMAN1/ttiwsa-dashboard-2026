import { Ticket } from "@/types/dashboard";

export const CHAT_IDS: Record<string, string> = {
  "@sayyidfaqihhh": "1356724050",
  "@chzadabi": "1256111343",
  "@bzandryrenaldy": "170841268"
};

// ==========================================
// TEST MAPPING: Distributed equally (33.3% each) among 3 test IDs
// ==========================================
/*
export const USER_MAPPING: Record<string, string> = {
  // @sayyidfaqihhh (13 STOs)
  "BOO": "@sayyidfaqihhh",
  "PAG": "@sayyidfaqihhh",
  "CPS": "@sayyidfaqihhh",
  "CWI": "@sayyidfaqihhh",
  "CSR": "@sayyidfaqihhh",
  "CRI": "@sayyidfaqihhh",
  "CJU": "@sayyidfaqihhh",
  "PLR": "@sayyidfaqihhh",
  "KLU": "@sayyidfaqihhh",
  "JPK": "@sayyidfaqihhh",
  "CKB": "@sayyidfaqihhh",
  "CCR": "@sayyidfaqihhh",
  "CBD": "@sayyidfaqihhh",

  // @chzadabi (13 STOs)
  "BGL": "@chzadabi",
  "TJH": "@chzadabi",
  "CBI": "@chzadabi",
  "BJD": "@chzadabi",
  "JGL": "@chzadabi",
  "CLS": "@chzadabi",
  "CAU": "@chzadabi",
  "LWL": "@chzadabi",
  "LBI": "@chzadabi",
  "JSA": "@chzadabi",
  "DMG": "@chzadabi",
  "CGD": "@chzadabi",
  "GPI": "@chzadabi",

  // @bzandryrenaldy (13 STOs)
  "CSN": "@bzandryrenaldy",
  "KHL": "@bzandryrenaldy",
  "SPL": "@bzandryrenaldy",
  "PAR": "@bzandryrenaldy",
  "CSE": "@bzandryrenaldy",
  "STL": "@bzandryrenaldy",
  "PMU": "@bzandryrenaldy",
  "CTR": "@bzandryrenaldy",
  "SKB": "@bzandryrenaldy",
  "SGN": "@bzandryrenaldy",
  "NLD": "@bzandryrenaldy",
  "CMO": "@bzandryrenaldy",
  "PLG": "@bzandryrenaldy"
};
*/

export const OVERSEERS = [
  "@sayyidfaqihhh",
  "@rasyah06",
  "@rizqianaputri",
  "@bzandryrenaldy",
  "@anzis_19"
];

// ==========================================
// FULL MAPPING BACKUP (Uncomment when going live)
// ==========================================
export const FULL_USER_MAPPING: Record<string, string> = {
  "BOO": "@dwiviyanto @Sll_bersyukur @Sherinaviola @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "PAG": "@SVXR11 @Yuse0006 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CPS": "@SVXR11 @Yuse0006 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CWI": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CSR": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CRI": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CJU": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "PLR": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "KLU": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "JPK": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CKB": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CCR": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CBD": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "BGL": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "TJH": "@hrriasman @Selly_Sheza_Zafran @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CBI": "@hrriasman @Selly_Sheza_Zafran @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "BJD": "@hrriasman @Selly_Sheza_Zafran @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "JGL": "@BPS906141 @ariopangestu @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CLS": "@BPS906141 @ariopangestu @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CAU": "@BPS906141 @ariopangestu @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "LWL": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "LBI": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "JSA": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "DMG": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CGD": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "GPI": "@BPS906141 @BocahKentirrr @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CSN": "@BPS906141 @BocahKentirrr @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "KHL": "@Mumpuni @BroMike87 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "SPL": "@Pratamaa91 @Denhamdi @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "PAR": "@Pratamaa91 @Denhamdi @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CSE": "@Pratamaa91 @Denhamdi @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "STL": "@Inoskyblue @deni_les @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "PMU": "@Inoskyblue @deni_les @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CTR": "@Inoskyblue @deni_les @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "SKB": "@DaniSkb @elfaathin @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "SGN": "@DaniSkb @elfaathin @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "NLD": "@DaniSkb @elfaathin @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19",
  "CMO": "@DaniSkb @elfaathin @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy @anzis_19"
};

export function isUserWhitelisted(username: string): boolean {
  if (!username) return false;
  const target = username.toLowerCase();
  for (const stoUsers of Object.values(FULL_USER_MAPPING)) {
    const users = stoUsers.split(" ").map(u => u.toLowerCase());
    if (users.includes(`@${target}`) || users.includes(target)) {
      return true;
    }
  }
  return false;
}

export function formatNotComplyMessage(tickets: Ticket[], saName?: string, allTickets?: Ticket[], isOverseer?: boolean): string {
  const headerTitle = saName ? `REKON NOT COMPLY - SA ${saName.toUpperCase()}` : "REKON NOT COMPLY";
  let message = `\n\n${headerTitle}\n\nLink Update:\nhttps://ttiwsa-dashboard-2026.vercel.app/submit/not-comply\n\n`;

  tickets.forEach(t => {
    const isTTI = t.STATUS.startsWith("TTI");
    if (isTTI) {
      // Prioritize ORDER_TYPE, fallback to SYMTOM, else just 'Ticket'
      const type = t.ORDER_TYPE ? t.ORDER_TYPE.trim() : (t.SYMTOM ? t.SYMTOM.trim() : "Ticket");
      message += `TTI ${type} ${t.SC} ${t.STO}\n`;
    } else {
      // FFG
      message += `FFG ${t.SC} ${t.STO}\n`;
    }
  });

  if (isOverseer && allTickets && allTickets.length > 0) {
    message += "\n";
    const saCounts: Record<string, number> = {};
    allTickets.forEach(t => {
      const sa = t.SA || "UNKNOWN";
      saCounts[sa] = (saCounts[sa] || 0) + 1;
    });

    const sortedSa = Object.entries(saCounts).sort((a, b) => b[1] - a[1]);
    sortedSa.forEach(([sa, count]) => {
      message += `${sa} : ${count} ticket\n`;
    });
  }

  return message;
}
