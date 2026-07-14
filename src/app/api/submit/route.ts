import { NextResponse } from "next/server";
import { SUBMIT_ENDPOINT_URL } from "@/lib/constants";
import { jwtVerify } from "jose";

export async function POST(request: Request) {
  try {
    if (!SUBMIT_ENDPOINT_URL) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const payload = await request.text();
    let isProtectedAction = false;

    // Check if the payload contains a Reject/Accept action
    try {
      const parsedPayload = JSON.parse(payload);
      if (parsedPayload.data && parsedPayload.data["REJECT/ACCEPT EVIDENCE"]) {
        isProtectedAction = true;
      }
    } catch (e) {
      // Not JSON, just continue
    }

    // If it's a protected action, strictly verify the JWT
    if (isProtectedAction) {
      // Next.js Request cookies requires parsing from headers in older versions, 
      // but in App Router Route Handlers we can parse cookies directly from the request object or headers.
      // Wait, request is the standard Web Request, we can get cookies from headers.
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]*)/);
      const token = match ? match[1] : null;

      if (!token) {
        return NextResponse.json({ error: "Unauthorized: Admin login required to approve/reject" }, { status: 401 });
      }

      try {
        const secretKey = process.env.JWT_SECRET;
        if (!secretKey) throw new Error("JWT_SECRET is missing from environment variables");
        const secret = new TextEncoder().encode(secretKey);
        await jwtVerify(token, secret);
      } catch (err) {
        return NextResponse.json({ error: "Unauthorized: Invalid or expired session" }, { status: 401 });
      }
    }

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
      return NextResponse.json({ success: true, response: gasText });
    }
  } catch (error) {
    console.error("Submit Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
