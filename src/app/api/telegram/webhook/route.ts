import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { isUserWhitelisted } from "@/lib/telegramConfig";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Telegram sends the message inside 'message'
    if (payload.message) {
      const chat = payload.message.chat;
      const from = payload.message.from;
      
      const chatId = chat.id;
      const username = from.username; // Note: username may be undefined if user doesn't have one set

      if (chatId && username) {
        // Only save if the user is in our FULL_USER_MAPPING whitelist
        if (isUserWhitelisted(username)) {
          // Save mapped in Redis
          await redis.set(`telegram:user:@${username}`, chatId.toString());
          console.log(`Registered authorized user: @${username} with chatId: ${chatId}`);
          
          // Send a welcome message if they typed /report
          if (payload.message.text === "/report") {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (botToken) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `✅ Successfully registered! You will now receive "Not Comply" alerts.`,
                }),
              }).catch(err => console.error("Failed to send welcome message:", err));
            }
          }
        } else {
          console.warn(`Unauthorized Telegram registration attempt from: @${username}`);
        }
      }
    }

    // Always return 200 OK to Telegram so it doesn't retry the webhook endlessly
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
