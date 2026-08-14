import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/api";
import { FULL_USER_MAPPING, formatNotComplyMessage, OVERSEERS } from "@/lib/telegramConfig";
import { redis } from "@/lib/redis";
import { Ticket } from "@/types/dashboard";
import { jwtVerify } from "jose";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]*)/);
    const token = match ? match[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const secretKey = process.env.JWT_SECRET;
      if (!secretKey) throw new Error("JWT_SECRET is missing from environment variables");
      const secret = new TextEncoder().encode(secretKey);
      await jwtVerify(token, secret);
    } catch (err) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error("Missing Telegram Bot Token");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const data = await fetchDashboardData();
    const allTickets: Ticket[] = [...data.ttiTickets, ...data.ffgTickets];

    // Filter tickets that need update and are NOT COMPLY, but exclude those that have been updated (isUpdated: true)
    const needUpdateTickets = allTickets.filter(t => t.NULL_GDOC === true && t.STATUS.includes("-NOTC") && !t.isUpdated);

    // Group by Service Area (SA)
    const groupedBySA = needUpdateTickets.reduce((acc, ticket) => {
      const sa = ticket.SA || "UNKNOWN";
      if (!acc[sa]) {
        acc[sa] = [];
      }
      acc[sa].push(ticket);
      return acc;
    }, {} as Record<string, Ticket[]>);

    let sentCount = 0;

    for (const [sa, tickets] of Object.entries(groupedBySA)) {
      if (tickets.length === 0) continue;

      const baseText = formatNotComplyMessage(tickets, sa, needUpdateTickets, false);
      const overseerText = formatNotComplyMessage(tickets, sa, needUpdateTickets, true);

      // Aggregate all STOs that belong to this SA
      const stoSet = new Set<string>();
      allTickets.filter(t => (t.SA || "UNKNOWN") === sa).forEach(t => { if (t.STO) stoSet.add(t.STO); });
      tickets.forEach(t => { if (t.STO) stoSet.add(t.STO); });

      // Get users for all STOs under this SA
      const usernames = new Set<string>();
      stoSet.forEach(sto => {
        const mappedUsers = FULL_USER_MAPPING[sto] || "";
        mappedUsers.split(" ").filter(Boolean).forEach(u => usernames.add(u));
      });

      for (const username of usernames) {
        const isOverseer = OVERSEERS.includes(username.toLowerCase());
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
          console.error(`Telegram API Error for SA ${sa} (user ${username}):`, telegramData);
        } else {
          sentCount++;
        }
      }
    }

    return NextResponse.json({ success: true, message: `Manual report sent ${sentCount} times across Service Areas` });
  } catch (error) {
    console.error("Error sending manual report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
