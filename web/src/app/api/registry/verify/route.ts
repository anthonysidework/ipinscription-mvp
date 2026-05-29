import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/registry/verify?hash=0x... — look a content hash up in the index. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hash = searchParams.get("hash");
  if (!hash) {
    return NextResponse.json({ error: "Missing hash" }, { status: 400 });
  }
  try {
    const record = await registry().getByHash(hash);
    return NextResponse.json({ exists: !!record, record: record ?? null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verify error" },
      { status: 500 }
    );
  }
}
