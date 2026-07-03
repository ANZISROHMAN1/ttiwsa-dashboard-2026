import { NextResponse } from "next/server";

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
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
  }
}
