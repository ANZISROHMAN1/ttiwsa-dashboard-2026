import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/api";
import { FULL_USER_MAPPING, formatNotComplyMessage, OVERSEERS } from "@/lib/telegramConfig";
import { redis } from "@/lib/redis";
import { Ticket } from "@/types/dashboard";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Optional security: Check a CRON_SECRET if it's set
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({ error: "Missing Telegram config" }, { status: 500 });
  }

  try {
    const data = await fetchDashboardData();
    const allTickets: Ticket[] = [...data.ttiTickets, ...data.ffgTickets];

    // Filter tickets that need update and are NOT COMPLY, but exclude those that have been updated (isUpdated: true)
    const needUpdateTickets = allTickets.filter(t => t.NULL_GDOC === true && t.STATUS.includes("-NOTC") && !t.isUpdated);

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
      if (tickets.length === 0) continue; // No empty messages

      const baseText = formatNotComplyMessage(tickets, needUpdateTickets, false);
      const overseerText = formatNotComplyMessage(tickets, needUpdateTickets, true);

      // Get users for this STO
      const mappedUsers = FULL_USER_MAPPING[sto] || "";
      const usernames = new Set(mappedUsers.split(" ").filter(Boolean));

      for (const username of usernames) {
        const isOverseer = OVERSEERS.some(o => o.toLowerCase() === username.toLowerCase());
        const text = isOverseer ? overseerText : baseText;

        // Fetch Chat ID dynamically from Upstash Redis
        const chatId = await redis.get(`telegram:user:${username}`);
        
        if (!chatId) {
          console.warn(`Could not find Chat ID for user ${username} in Redis`);
          continue;
        }

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
          // We continue to send to other STOs even if one fails
        } else {
          sentCount++;
        }
      }
    }

    return NextResponse.json({ success: true, message: `Sent ${sentCount} Not Comply reports.` });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
