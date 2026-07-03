import { NextResponse } from "next/server";
import { SUBMIT_ENDPOINT_URL } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    if (!SUBMIT_ENDPOINT_URL) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const payload = await request.text();

    await fetch(SUBMIT_ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: payload,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
