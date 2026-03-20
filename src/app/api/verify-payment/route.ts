import { NextRequest, NextResponse } from "next/server";
import { verifySearchPayment } from "@/lib/chain";
import { issueToken } from "@/lib/cache";

export async function POST(req: NextRequest) {
  const { txHash, address } = await req.json();

  if (!txHash || !address) {
    return NextResponse.json({ error: "txHash and address required" }, { status: 400 });
  }

  const result = await verifySearchPayment(txHash, address);
  console.log("verify result:", result);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason ?? "Payment not verified" },
      { status: 402 }
    );
  }

  // Issue a short-lived search pass (5 min) tied to this address
  const token = issueToken(address);
  return NextResponse.json({ ok: true, token });
}