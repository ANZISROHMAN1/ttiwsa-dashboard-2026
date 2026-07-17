import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { isUserWhitelisted } from "@/lib/telegramConfig";

export async function POST(request: Request) {
  try {
    // Secure the webhook using Telegram's secret token header
    const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn("Rejected webhook request due to invalid secret token.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
          if (payload.message.text === "/report") {
            const existingChatId = await redis.get(`telegram:user:@${username}`);
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            
            if (existingChatId) {
              if (botToken) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `ℹ️ Anda sudah registrasi, tidak perlu /report lagi.`,
                  }),
                }).catch(err => console.error("Failed to send already registered message:", err));
              }
            } else {
              // Save mapped in Redis
              await redis.set(`telegram:user:@${username}`, chatId.toString());
              console.log(`Registered authorized user: @${username} with chatId: ${chatId}`);
              
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
          } else if (payload.message.text === "/stop") {
            const existingChatId = await redis.get(`telegram:user:@${username}`);
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            
            if (existingChatId) {
              await redis.del(`telegram:user:@${username}`);
              console.log(`Unregistered user: @${username}`);
              
              if (botToken) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `🛑 Anda telah berhenti menerima notifikasi "Not Comply". Ketik /report untuk registrasi kembali.`,
                  }),
                }).catch(err => console.error("Failed to send stop message:", err));
              }
            } else {
              if (botToken) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `ℹ️ Anda belum terdaftar. Ketik /report untuk registrasi.`,
                  }),
                }).catch(err => console.error("Failed to send not registered message:", err));
              }
            }
          }
        } else {
          console.warn(`Unauthorized Telegram registration attempt from: @${username}`);
          
          if (payload.message.text === "/report") {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (botToken) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `❌ Unauthorized. Id anda (@${username}) tidak terdaftar di database`,
                }),
              }).catch(err => console.error("Failed to send unauthorized message:", err));
            }
          }
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
