import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const rateLimitMap = new Map<string, { attempts: number; lockoutUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    
    const record = rateLimitMap.get(ip);
    if (record && record.lockoutUntil > Date.now()) {
      const remainingMinutes = Math.ceil((record.lockoutUntil - Date.now()) / 60000);
      return NextResponse.json(
        { success: false, message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      console.error("ADMIN_USERNAME or ADMIN_PASSWORD is not set in environment variables.");
      return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 });
    }

    if (username === validUsername && password === validPassword) {

      rateLimitMap.delete(ip);

      const secretKey = process.env.JWT_SECRET || "default_dev_secret_please_change_in_prod";
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
      const currentAttempts = record ? record.attempts + 1 : 1;
      const lockoutUntil = currentAttempts >= MAX_ATTEMPTS 
        ? Date.now() + LOCKOUT_MINUTES * 60000 
        : 0;
        
      rateLimitMap.set(ip, { attempts: currentAttempts, lockoutUntil });

      return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
  }
}
