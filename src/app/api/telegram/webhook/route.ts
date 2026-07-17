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
          
          // Optionally, we could send a welcome message back to the user here using the bot token,
          // but dropping silently is fine as well.
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
