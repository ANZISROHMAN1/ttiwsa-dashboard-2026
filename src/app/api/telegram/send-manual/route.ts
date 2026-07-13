import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/api";
import { USER_MAPPING, CHAT_IDS, formatNotComplyMessage } from "@/lib/telegramConfig";
import { Ticket } from "@/types/dashboard";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error("Missing Telegram Bot Token");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const data = await fetchDashboardData();
    const allTickets: Ticket[] = [...data.ttiTickets, ...data.ffgTickets];

    // Filter tickets that need update and are NOT COMPLY
    const needUpdateTickets = allTickets.filter(t => t.NULL_GDOC === true && t.STATUS.includes("-NOTC"));

    // Group by STO
    const groupedBySTO = needUpdateTickets.reduce((acc, ticket) => {
      const sto = ticket.STO || "UNKNOWN";
      if (!acc[sto]) {
        acc[sto] = [];
      }
      acc[sto].push(ticket);
      return acc;
    }, {} as Record<string, Ticket[]>);

    let sentCount = 0;

    for (const [sto, tickets] of Object.entries(groupedBySTO)) {
      if (tickets.length === 0) continue;

      const text = formatNotComplyMessage(tickets);

      // Get users for this STO
      const mappedUsers = USER_MAPPING[sto] || "";
      const usernames = new Set(mappedUsers.split(" ").filter(Boolean));

      for (const username of usernames) {
        const chatId = CHAT_IDS[username];
        if (!chatId) continue;

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
          }),
        });

        const telegramData = await response.json();
        if (!response.ok) {
          console.error(`Telegram API Error for STO ${sto} (user ${username}):`, telegramData);
        } else {
          sentCount++;
        }
      }
    }

    return NextResponse.json({ success: true, message: `Manual report sent ${sentCount} times across STOs` });
  } catch (error) {
    console.error("Error sending manual report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
