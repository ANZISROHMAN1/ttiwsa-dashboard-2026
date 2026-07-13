import { Ticket } from "@/types/dashboard";

export const CHAT_IDS: Record<string, string> = {
  "@sayyidfaqihhh": "1356724050",
  "@chzadabi": "1256111343",
  "@bzandryrenaldy": "170841268"
};

// ==========================================
// TEST MAPPING: Distributed equally (33.3% each) among 3 test IDs
// ==========================================
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

// ==========================================
// FULL MAPPING BACKUP (Uncomment when going live)
// ==========================================
/*
export const FULL_USER_MAPPING: Record<string, string> = {
  "BOO": "@dwiviyanto @Sll_bersyukur @Sherinaviola",
  "PAG": "@Yusup1995 @Yuse0006",
  "CPS": "@Yusup1995 @Yuse0006",
  "CWI": "@Inoskyblue @IanNurdiansyah23",
  "CSR": "@Inoskyblue @IanNurdiansyah23",
  "CRI": "@Inoskyblue @IanNurdiansyah23",
  "CJU": "@Inoskyblue @IanNurdiansyah23",
  "PLR": "@hanya_sementaraaa @er_permana",
  "KLU": "@hanya_sementaraaa @er_permana",
  "JPK": "@hanya_sementaraaa @er_permana",
  "CKB": "@hanya_sementaraaa @er_permana",
  "CCR": "@hanya_sementaraaa @er_permana",
  "CBD": "@hanya_sementaraaa @er_permana",
  "BGL": "@hanya_sementaraaa @er_permana",
  "TJH": "@hrriasman @Selly_Sheza_Zafran",
  "CBI": "@hrriasman @Selly_Sheza_Zafran",
  "BJD": "@hrriasman @Selly_Sheza_Zafran",
  "JGL": "@BPS906141 @ariopangestu",
  "CLS": "@BPS906141 @ariopangestu",
  "CAU": "@BPS906141 @ariopangestu",
  "LWL": "@Bodoamattttt @Masya_alloh",
  "LBI": "@Bodoamattttt @Masya_alloh",
  "JSA": "@Bodoamattttt @Masya_alloh",
  "DMG": "@Bodoamattttt @Masya_alloh",
  "CGD": "@Bodoamattttt @Masya_alloh",
  "GPI": "@SVXR11 @BocahKentirrr",
  "CSN": "@SVXR11 @BocahKentirrr",
  "KHL": "@Mumpuni @BroMike87",
  "SPL": "@Pratamaa91 @Denhamdi",
  "PAR": "@Pratamaa91 @Denhamdi",
  "CSE": "@Pratamaa91 @Denhamdi",
  "STL": "@C_Ruswandi_7 @deni_les",
  "PMU": "@C_Ruswandi_7 @deni_les",
  "CTR": "@C_Ruswandi_7 @deni_les",
  "SKB": "@DaniSkb @elfaathin",
  "SGN": "@DaniSkb @elfaathin",
  "NLD": "@DaniSkb @elfaathin",
  "CMO": "@DaniSkb @elfaathin"
};
*/

export function formatNotComplyMessage(tickets: Ticket[]): string {
  let message = "format japrinya \n\nREKON NOT COMPLY\n\nLink Update:\nhttps://ttiwsa-dashboard-2026.vercel.app/submit/not-comply\n\n";

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
