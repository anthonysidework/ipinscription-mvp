import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/registry";
import type { AddRecordInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/registry?offset=&limit= — newest-first page + total. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 12)));
  try {
    const reg = registry();
    const [total, records] = await Promise.all([
      reg.total(),
      reg.list(offset, limit),
    ]);
    return NextResponse.json({ total, records });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Registry error" },
      { status: 500 }
    );
  }
}

/** POST /api/registry — add a record after a successful inscription. */
export async function POST(req: NextRequest) {
  let body: Partial<AddRecordInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = [
    "contentHash",
    "cid",
    "metadataURI",
    "owner",
    "txid",
    "title",
    "network",
  ] as const;
  for (const k of required) {
    if (!body[k] || typeof body[k] !== "string") {
      return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 });
    }
  }

  try {
    const record = await registry().add(body as AddRecordInput);
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add record" },
      { status: 500 }
    );
  }
}
