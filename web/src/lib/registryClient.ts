/**
 * Browser-side helpers for talking to the registry API routes.
 */
import type { InscriptionRecord, AddRecordInput } from "./types";

export async function addRecord(input: AddRecordInput): Promise<InscriptionRecord> {
  const res = await fetch("/api/registry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await safeErr(res)) || "Failed to save record");
  return res.json();
}

export async function verifyByHash(
  contentHash: string
): Promise<{ exists: boolean; record: InscriptionRecord | null }> {
  const res = await fetch(
    `/api/registry/verify?hash=${encodeURIComponent(contentHash)}`
  );
  if (!res.ok) throw new Error((await safeErr(res)) || "Verify failed");
  return res.json();
}

export async function listRecords(
  offset: number,
  limit: number
): Promise<{ total: number; records: InscriptionRecord[] }> {
  const res = await fetch(`/api/registry?offset=${offset}&limit=${limit}`);
  if (!res.ok) throw new Error((await safeErr(res)) || "List failed");
  return res.json();
}

export async function listByOwner(owner: string): Promise<InscriptionRecord[]> {
  const res = await fetch(`/api/registry/owner?address=${encodeURIComponent(owner)}`);
  if (!res.ok) throw new Error((await safeErr(res)) || "List failed");
  return res.json();
}

export async function getRecord(id: number): Promise<InscriptionRecord | null> {
  const res = await fetch(`/api/registry/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error((await safeErr(res)) || "Fetch failed");
  return res.json();
}

async function safeErr(res: Response): Promise<string> {
  try {
    const d = await res.json();
    return d?.error || res.statusText;
  } catch {
    return res.statusText;
  }
}
