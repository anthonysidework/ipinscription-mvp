import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/registry/owner?address=... — records owned by an address. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }
  try {
    const records = await registry().listByOwner(address);
    return NextResponse.json(records);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Registry error" },
      { status: 500 }
    );
  }
}
