import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]*)/);
    const token = match ? match[1] : null;

    if (!token) {
      return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) throw new Error("JWT_SECRET is missing from environment variables");
    const secret = new TextEncoder().encode(secretKey);
    await jwtVerify(token, secret);

    return NextResponse.json({ isLoggedIn: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }
}
