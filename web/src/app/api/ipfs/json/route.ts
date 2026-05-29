import { NextRequest, NextResponse } from "next/server";

/**
 * Pins a metadata JSON object to IPFS via Pinata. Server-side only.
 */
export const runtime = "nodejs";

const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export async function POST(req: NextRequest) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "Server is missing PINATA_JWT. See .env.example." },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body.contentHash !== "string" || typeof body.title !== "string") {
    return NextResponse.json(
      { error: "Metadata must include title and contentHash" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(PINATA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        pinataContent: body,
        pinataMetadata: { name: `ip-inscription-meta-${body.contentHash}` },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.reason || data?.error || "Pinata error" },
        { status: 502 }
      );
    }
    return NextResponse.json({ cid: data.IpfsHash });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 502 }
    );
  }
}
