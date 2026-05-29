import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/registry/[id] — a single record by registry id. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const record = await registry().getById(Number(id));
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Registry error" },
      { status: 500 }
    );
  }
}
