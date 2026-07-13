import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/api";
import { generateTelegramText } from "@/lib/telegram";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Optional security: Check a CRON_SECRET if it's set
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TEST_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json({ error: "Missing Telegram config" }, { status: 500 });
  }

  try {
    const data = await fetchDashboardData();
    const text = generateTelegramText(data, false);

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });

    const telegramData = await response.json();

    if (!response.ok) {
      throw new Error(`Telegram API Error: ${JSON.stringify(telegramData)}`);
    }

    return NextResponse.json({ success: true, message: "Automated report sent!" });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
