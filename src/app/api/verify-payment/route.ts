import { NextRequest, NextResponse } from "next/server";
import { verifySearchPayment } from "@/lib/chain";
import { cacheSet } from "@/lib/cache";

export async function POST(req: NextRequest) {
  const { txHash, address } = await req.json();

  if (!txHash || !address) {
    return NextResponse.json({ error: "txHash and address required" }, { status: 400 });
  }

  const result = await verifySearchPayment(txHash, address);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason ?? "Payment not verified" },
      { status: 402 }
    );
  }

  // Issue a short-lived search pass (5 min) tied to this address
  const token = `${address.toLowerCase()}-${Date.now()}`;
  cacheSet(`pass:${address.toLowerCase()}`, token, 5 * 60_000);

  return NextResponse.json({ ok: true, token });
}