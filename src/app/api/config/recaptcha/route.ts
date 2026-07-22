import { NextResponse } from "next/server";

export async function GET() {
  const siteKey = process.env.SITE_KEY_SI_CAPTCHA || "";
  return NextResponse.json({ siteKey });
}
