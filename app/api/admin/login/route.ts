import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassphrase, setAdminCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { passphrase } = await req.json();
  const ok = await verifyAdminPassphrase(passphrase);
  if (!ok) {
    return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
