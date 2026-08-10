import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/api";
import { generateTelegramText } from "@/lib/telegram";
import { redis } from "@/lib/redis";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Optional security: Check a CRON_SECRET if it's set
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const envChatIds = [process.env.TEST_CHAT_ID, process.env.TEST_CHAT_ID2].filter(Boolean) as string[];

  if (!botToken) {
    return NextResponse.json({ error: "Missing Telegram config" }, { status: 500 });
  }

  try {
    const keys = await redis.keys("telegram:user:*");
    const registeredChatIds: string[] = [];
    for (const key of keys) {
      const val = await redis.get<string>(key);
      if (val) registeredChatIds.push(val.toString());
    }

    const chatIds = Array.from(new Set([...envChatIds, ...registeredChatIds]));

    if (chatIds.length === 0) {
      return NextResponse.json({ error: "No Telegram chat IDs registered or configured" }, { status: 500 });
    }

    const data = await fetchDashboardData();
    const text = generateTelegramText(data, false);

    const responses = await Promise.all(
      chatIds.map(chatId => 
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: "Markdown",
          })
        })
      )
    );

    const telegramData = await Promise.all(responses.map(res => res.json()));
    const hasError = responses.some(res => !res.ok);

    if (hasError) {
      throw new Error(`Telegram API Error: ${JSON.stringify(telegramData)}`);
    }

    return NextResponse.json({ success: true, message: `Automated report sent to ${chatIds.length} chats!` });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
