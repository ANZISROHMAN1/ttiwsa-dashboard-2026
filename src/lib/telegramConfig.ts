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
  "BOO": "@dwiviyanto @Sll_bersyukur @Sherinaviola @sayyidfaqihhh",
  "PAG": "@SVXR11 @Yuse0006 @sayyidfaqihhh",
  "CPS": "@SVXR11 @Yuse0006 @sayyidfaqihhh",
  "CWI": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh",
  "CSR": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh",
  "CRI": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh",
  "CJU": "@Yusup1995 @IanNurdiansyah23 @sayyidfaqihhh",
  "PLR": "@hanya_sementaraaa @er_permana @sayyidfaqihhh",
  "KLU": "@hanya_sementaraaa @er_permana @sayyidfaqihhh",
  "JPK": "@hanya_sementaraaa @er_permana @sayyidfaqihhh",
  "CKB": "@hanya_sementaraaa @er_permana @sayyidfaqihhh",
  "CCR": "@hanya_sementaraaa @er_permana @sayyidfaqihhh",
  "CBD": "@hanya_sementaraaa @er_permana @sayyidfaqihhh",
  "BGL": "@hanya_sementaraaa @er_permana @sayyidfaqihhh",
  "TJH": "@hrriasman @Selly_Sheza_Zafran @sayyidfaqihhh",
  "CBI": "@hrriasman @Selly_Sheza_Zafran @sayyidfaqihhh",
  "BJD": "@hrriasman @Selly_Sheza_Zafran @sayyidfaqihhh",
  "JGL": "@BPS906141 @ariopangestu @sayyidfaqihhh",
  "CLS": "@BPS906141 @ariopangestu @sayyidfaqihhh",
  "CAU": "@BPS906141 @ariopangestu @sayyidfaqihhh",
  "LWL": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh",
  "LBI": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh",
  "JSA": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh",
  "DMG": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh",
  "CGD": "@Bodoamattttt @Masya_alloh @sayyidfaqihhh",
  "GPI": "@BPS906141 @BocahKentirrr @sayyidfaqihhh",
  "CSN": "@BPS906141 @BocahKentirrr @sayyidfaqihhh",
  "KHL": "@Mumpuni @BroMike87 @sayyidfaqihhh",
  "SPL": "@Pratamaa91 @Denhamdi @sayyidfaqihhh",
  "PAR": "@Pratamaa91 @Denhamdi @sayyidfaqihhh",
  "CSE": "@Pratamaa91 @Denhamdi @sayyidfaqihhh",
  "STL": "@Inoskyblue @deni_les @sayyidfaqihhh",
  "PMU": "@Inoskyblue @deni_les @sayyidfaqihhh",
  "CTR": "@Inoskyblue @deni_les @sayyidfaqihhh",
  "SKB": "@DaniSkb @elfaathin @sayyidfaqihhh",
  "SGN": "@DaniSkb @elfaathin @sayyidfaqihhh",
  "NLD": "@DaniSkb @elfaathin @sayyidfaqihhh",
  "CMO": "@DaniSkb @elfaathin @sayyidfaqihhh"
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

export function formatNotComplyMessage(tickets: Ticket[]): string {
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

  return message;
}
