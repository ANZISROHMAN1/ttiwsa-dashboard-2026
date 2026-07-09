import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      console.error("ADMIN_USERNAME or ADMIN_PASSWORD is not set in environment variables.");
      return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 });
    }

    if (username === validUsername && password === validPassword) {
      // Create JWT
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
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    } else {
      return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
  }
}
