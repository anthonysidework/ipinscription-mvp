/**
 * Thin client helpers that talk to our own /api/ipfs routes. The actual Pinata
 * pinning happens server-side so the PINATA_JWT secret never reaches the browser.
 */

export type InscriptionMetadata = {
  title: string;
  description?: string;
  type?: string;
  contentHash: string;
  fileName?: string;
  mimeType?: string;
};

export type PinResult = { cid: string };

/** Upload a raw file to IPFS via the server route. Returns its CID. */
export async function pinFile(file: File): Promise<PinResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/ipfs/file", { method: "POST", body: form });
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(`File upload failed: ${msg}`);
  }
  return res.json();
}

/** Upload a metadata JSON object to IPFS via the server route. Returns its CID. */
export async function pinJson(metadata: InscriptionMetadata): Promise<PinResult> {
  const res = await fetch("/api/ipfs/json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(`Metadata upload failed: ${msg}`);
  }
  return res.json();
}

async function safeError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || res.statusText;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}
