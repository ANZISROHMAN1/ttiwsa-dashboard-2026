import type { DashboardData } from "@/types/dashboard";

export function generateTelegramText(data: DashboardData, isManual: boolean = false): string {
  const d = new Date();
  const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  const header = isManual ? `📊 *MANUAL REPORT - ${dateStr}*` : `📊 *DAILY REPORT - ${dateStr}*`;
  
  const { rankingSA, summary, saldoPspiTickets, unspecTickets } = data;
  
  // Calculate total achievement
  const sum = rankingSA.reduce((acc, curr) => acc + curr.achievement, 0);
  const avgAchievement = rankingSA.length > 0 ? (sum / rankingSA.length).toFixed(2) : "0.00";
  
  let text = `${header}\n\n`;
  text += `*Overall Regional Achievement:* ${avgAchievement}%\n\n`;

  if (summary) {
    text += `*--- INDIHOME ---*\n`;
    text += `*TTI 3x24:* ${summary["TTI INDIHOME"]?.achievement?.toFixed(2)}% (Target: ${summary["TTI INDIHOME"]?.target}%)\n`;
    const topTtiIH = [...rankingSA].sort((a, b) => b.ttiIH - a.ttiIH).slice(0, 5);
    text += `_Top 5 TTI 3x24:_\n${topTtiIH.map((s,i) => `${i+1}. ${s.sa}: ${s.ttiIH.toFixed(2)}%`).join("\n")}\n\n`;

    text += `*TTR FFG:* ${summary["FFG INDIHOME"]?.achievement?.toFixed(2)}% (Target: ${summary["FFG INDIHOME"]?.target}%)\n`;
    const topFfgIH = [...rankingSA].sort((a, b) => b.ffgIH - a.ffgIH).slice(0, 5);
    text += `_Top 5 TTR FFG:_\n${topFfgIH.map((s,i) => `${i+1}. ${s.sa}: ${s.ffgIH.toFixed(2)}%`).join("\n")}\n\n`;

    text += `*FFG Garansi:* ${summary["GARANSI INDIHOME"]?.achievement?.toFixed(2)}% (Target: 98.29%)\n`;
    const topGaransiIH = [...rankingSA].sort((a, b) => b.garansiIH - a.garansiIH).slice(0, 5);
    text += `_Top 5 FFG Garansi:_\n${topGaransiIH.map((s,i) => `${i+1}. ${s.sa}: ${s.garansiIH.toFixed(2)}%`).join("\n")}\n\n`;

    text += `*--- INDIBIZ ---*\n`;
    text += `*TTI 1x24:* ${summary["TTI INDIBIZ"]?.achievement?.toFixed(2)}% (Target: ${summary["TTI INDIBIZ"]?.target}%)\n`;
    const topTtiIB = [...rankingSA].sort((a, b) => b.ttiIB - a.ttiIB).slice(0, 5);
    text += `_Top 5 TTI 1x24:_\n${topTtiIB.map((s,i) => `${i+1}. ${s.sa}: ${s.ttiIB.toFixed(2)}%`).join("\n")}\n\n`;

    text += `*TTR FFG:* ${summary["FFG INDIBIZ"]?.achievement?.toFixed(2)}% (Target: ${summary["FFG INDIBIZ"]?.target}%)\n`;
    const topFfgIB = [...rankingSA].sort((a, b) => b.ffgIB - a.ffgIB).slice(0, 5);
    text += `_Top 5 TTR FFG:_\n${topFfgIB.map((s,i) => `${i+1}. ${s.sa}: ${s.ffgIB.toFixed(2)}%`).join("\n")}\n\n`;

    text += `*FFG Garansi:* ${summary["GARANSI INDIBIZ"]?.achievement?.toFixed(2)}% (Target: 99.40%)\n`;
    const topGaransiIB = [...rankingSA].sort((a, b) => b.garansiIB - a.garansiIB).slice(0, 5);
    text += `_Top 5 FFG Garansi:_\n${topGaransiIB.map((s,i) => `${i+1}. ${s.sa}: ${s.garansiIB.toFixed(2)}%`).join("\n")}\n\n`;
  }

  const allSAs = Array.from(new Set(rankingSA.map((r) => r.sa)));
  
  const getPspiUnspecRanking = (tickets: any[]) => {
    const ticketCounts = new Map<string, number>();
    for (const sa of allSAs) {
      if (sa && sa !== "BRANCH BOGOR") ticketCounts.set(sa, 0);
    }
    for (const t of tickets) {
      if (t.SA && ticketCounts.has(t.SA)) {
        ticketCounts.set(t.SA, (ticketCounts.get(t.SA) || 0) + 1);
      }
    }
    let maxTickets = 0;
    for (const count of ticketCounts.values()) {
      if (count > maxTickets) maxTickets = count;
    }
    const result = Array.from(ticketCounts.entries()).map(([sa, count]) => {
      let score = 100;
      if (maxTickets > 0 && count > 0) score = (1 - (count / maxTickets)) * 100;
      return { sa, count, score };
    });
    result.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.count - b.count;
    });
    return result;
  };

  const pspiRankingData = getPspiUnspecRanking(saldoPspiTickets || []);
  const topPspi = pspiRankingData.slice(0, 5);
  text += `*--- PS/PI ---*\n_Top 5 PS/PI:_\n${topPspi.map((s,i) => `${i+1}. ${s.sa}: ${s.score.toFixed(2)}% (${s.count} tickets)`).join("\n")}\n\n`;

  const unspecRankingData = getPspiUnspecRanking(unspecTickets || []);
  const topUnspec = unspecRankingData.slice(0, 5);
  text += `*--- UNSPEC ---*\n_Top 5 UNSPEC:_\n${topUnspec.map((s,i) => `${i+1}. ${s.sa}: ${s.score.toFixed(2)}% (${s.count} tickets)`).join("\n")}\n\n`;

  const top5SA = [...rankingSA].sort((a, b) => b.achievement - a.achievement).slice(0, 5);
  text += `🏆 *Top 5 Service Areas (Overall):*\n`;
  top5SA.forEach((sa, i) => {
    text += `${i + 1}. *${sa.sa}*: ${sa.achievement.toFixed(2)}%\n`;
  });

  if (!isManual) {
    text += `\n_This is an automated daily report._\n`;
  }
  
  text += `\n🔗 [View Full Dashboard](https://ttiwsa-dashboard-2026.vercel.app/performance)`;

  return text;
}

