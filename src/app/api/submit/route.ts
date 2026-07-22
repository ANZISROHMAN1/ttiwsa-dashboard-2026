import { NextResponse } from "next/server";
import { SUBMIT_ENDPOINT_URL } from "@/lib/constants";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { jwtVerify } from "jose";

export async function POST(request: Request) {
  try {
    if (!SUBMIT_ENDPOINT_URL) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const payload = await request.text();
    let isProtectedAction = false;
    let recaptchaToken: string | undefined = undefined;
    let forwardPayload = payload;

    try {
      const parsedPayload = JSON.parse(payload);
      if (parsedPayload.data && parsedPayload.data["REJECT/ACCEPT EVIDENCE"]) {
        isProtectedAction = true;
      }
      if (parsedPayload.recaptchaToken) {
        recaptchaToken = parsedPayload.recaptchaToken;
        delete parsedPayload.recaptchaToken;
        forwardPayload = JSON.stringify(parsedPayload);
      }
    } catch (e) {
      // Ignore parse error for non-JSON payloads
    }

    if (process.env.SEC_KEY_SI_CAPTCHA) {
      if (!recaptchaToken) {
        return NextResponse.json({ error: "reCAPTCHA verification required" }, { status: 400 });
      }
      const verifyResult = await verifyRecaptchaToken(recaptchaToken);
      if (!verifyResult.success) {
        return NextResponse.json({ error: verifyResult.error || "reCAPTCHA verification failed" }, { status: 400 });
      }
    }

    if (isProtectedAction) {
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
      body: forwardPayload,
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
