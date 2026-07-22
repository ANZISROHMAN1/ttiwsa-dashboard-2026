import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis =
  process.env.UPSTASH_REDIS_REST_URL
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
      })
    : null;

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function timingSafeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    crypto.timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "unknown";

    const rateLimitKey = `rate_limit:login:${ip}`;

    let currentAttempts = 0;

    if (redis) {
      const record = await redis.get<{ attempts: number }>(rateLimitKey);
      if (record) {
        currentAttempts = record.attempts;
        if (currentAttempts >= MAX_ATTEMPTS) {
          const ttl = await redis.ttl(rateLimitKey);
          const remainingMinutes = Math.ceil(ttl / 60);
          return NextResponse.json(
            { success: false, message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.` },
            { status: 429 }
          );
        }
      }
    }

    const body = await request.json();
    const { username, password } = body;

    const validUsername = process.env.ADMIN_USERNAME;
    const validPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!validUsername || !validPasswordHash) {
      console.error("ADMIN_USERNAME or ADMIN_PASSWORD_HASH is not set in environment variables.");
      return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 });
    }

    const usernameMatch = timingSafeCompare(username || "", validUsername);
    const passwordMatch = await bcrypt.compare(password || "", validPasswordHash);

    if (usernameMatch && passwordMatch) {
      if (redis) {
        await redis.del(rateLimitKey);
      }

      const secretKey = process.env.JWT_SECRET;
      if (!secretKey) throw new Error("JWT_SECRET is missing from environment variables");
      const secret = new TextEncoder().encode(secretKey);
      
      const jwt = await new SignJWT({ role: "admin", user: username })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secret);

      const response = NextResponse.json({ success: true });
      
      response.cookies.set({
        name: "auth_token",
        value: jwt,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return response;
    } else {
      if (redis) {
        await redis.set(rateLimitKey, { attempts: currentAttempts + 1 }, { ex: LOCKOUT_MINUTES * 60 });
      }

      return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
  }
}
