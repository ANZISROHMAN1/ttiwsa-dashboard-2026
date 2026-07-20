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

// ==========================================
// FULL MAPPING BACKUP (Uncomment when going live)
// ==========================================
export const FULL_USER_MAPPING: Record<string, string> = {
  "BOO": "@dwiviyanto @Sll_bersyukur @Sherinaviola @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "PAG": "@SVXR11 @Yuse0006 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CPS": "@SVXR11 @Yuse0006 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CWI": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CSR": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CRI": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CJU": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "PLR": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "KLU": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "JPK": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CKB": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CCR": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CBD": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "BGL": "@hanya_sementaraaa @er_permana @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "TJH": "@hrriasman @Selly_Sheza_Zafran @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CBI": "@hrriasman @Selly_Sheza_Zafran @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "BJD": "@hrriasman @Selly_Sheza_Zafran @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "JGL": "@BPS906141 @ariopangestu @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CLS": "@BPS906141 @ariopangestu @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CAU": "@BPS906141 @ariopangestu @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "LWL": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "LBI": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "JSA": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "DMG": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CGD": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "GPI": "@BPS906141 @BocahKentirrr @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CSN": "@BPS906141 @BocahKentirrr @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "KHL": "@Mumpuni @BroMike87 @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "SPL": "@Pratamaa91 @Denhamdi @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "PAR": "@Pratamaa91 @Denhamdi @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CSE": "@Pratamaa91 @Denhamdi @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "STL": "@Inoskyblue @deni_les @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "PMU": "@Inoskyblue @deni_les @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CTR": "@Inoskyblue @deni_les @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "SKB": "@DaniSkb @elfaathin @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "SGN": "@DaniSkb @elfaathin @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "NLD": "@DaniSkb @elfaathin @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy",
  "CMO": "@DaniSkb @elfaathin @sayyidfaqihhh @Rasyah06 @rizqianaputri @bzandryrenaldy"
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

export function formatNotComplyMessage(tickets: Ticket[], allTickets?: Ticket[], isOverseer?: boolean): string {
  let message = "\n\nREKON NOT COMPLY\n\nLink Update:\nhttps://ttiwsa-dashboard-2026.vercel.app/submit/not-comply\n\n";

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
