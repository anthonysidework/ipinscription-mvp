import { NextRequest, NextResponse } from "next/server";

/**
 * Pins an uploaded file to IPFS via Pinata. Runs server-side so PINATA_JWT is
 * never exposed to the browser.
 */
export const runtime = "nodejs";

const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export async function POST(req: NextRequest) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "Server is missing PINATA_JWT. See .env.example." },
      { status: 500 }
    );
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const form = new FormData();
  form.append("file", file, file.name || "upload.bin");
  form.append(
    "pinataMetadata",
    JSON.stringify({ name: file.name || "ip-inscription-file" })
  );

  try {
    const res = await fetch(PINATA_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: form,
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
