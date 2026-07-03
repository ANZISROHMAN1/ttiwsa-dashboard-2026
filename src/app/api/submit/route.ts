import { NextResponse } from "next/server";
import { SUBMIT_ENDPOINT_URL } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    if (!SUBMIT_ENDPOINT_URL) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const payload = await request.text();

    const gasResponse = await fetch(SUBMIT_ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: payload,
    });

    const gasText = await gasResponse.text();
    console.log("GAS Response:", gasText);

    try {
      const gasJson = JSON.parse(gasText);
      if (gasJson.error) {
        return NextResponse.json(gasJson, { status: 400 });
      }
      return NextResponse.json(gasJson);
    } catch {
      // If it's not JSON, just return it as text
      return NextResponse.json({ success: true, response: gasText });
    }
  } catch (error) {
    console.error("Submit Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
