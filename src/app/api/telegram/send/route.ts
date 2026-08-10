import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { redis } from "@/lib/redis";

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

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const envChatIds = [process.env.TEST_CHAT_ID, process.env.TEST_CHAT_ID2].filter(Boolean) as string[];

    if (!botToken) {
      console.error("Missing Telegram Bot Token");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const keys = await redis.keys("telegram:user:*");
    const registeredChatIds: string[] = [];
    for (const key of keys) {
      const val = await redis.get<string>(key);
      if (val) registeredChatIds.push(val.toString());
    }

    const chatIds = Array.from(new Set([...envChatIds, ...registeredChatIds]));

    if (chatIds.length === 0) {
      console.error("No Telegram Chat IDs registered or configured");
      return NextResponse.json({ error: "No chat IDs configured" }, { status: 500 });
    }

    const responses = await Promise.all(
      chatIds.map(chatId => 
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: "Markdown",
          }),
        })
      )
    );

    const data = await Promise.all(responses.map(res => res.json()));
    const hasError = responses.some(res => !res.ok);

    if (hasError) {
      console.error("Telegram API Error:", data);
      return NextResponse.json({ error: "Failed to send to Telegram", details: data }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Report sent successfully to ${chatIds.length} chats` });
  } catch (error) {
    console.error("Error sending to Telegram:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
