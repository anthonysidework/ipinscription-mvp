/**
 * Browser-side registry access. In DEMO MODE these read/write the visitor's own
 * localStorage (lib/demoStore); in real mode they call the server API routes.
 * The function signatures are identical either way, so pages don't care which.
 */
import type { InscriptionRecord, AddRecordInput } from "./types";
import { isDemo } from "./demo";
import {
  demoAdd,
  demoVerify,
  demoList,
  demoListByOwner,
  demoGet,
} from "./demoStore";

export async function addRecord(input: AddRecordInput): Promise<InscriptionRecord> {
  if (isDemo) return demoAdd(input);
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
  if (isDemo) return demoVerify(contentHash);
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
  if (isDemo) return demoList(offset, limit);
  const res = await fetch(`/api/registry?offset=${offset}&limit=${limit}`);
  if (!res.ok) throw new Error((await safeErr(res)) || "List failed");
  return res.json();
}

export async function listByOwner(owner: string): Promise<InscriptionRecord[]> {
  if (isDemo) return demoListByOwner(owner);
  const res = await fetch(`/api/registry/owner?address=${encodeURIComponent(owner)}`);
  if (!res.ok) throw new Error((await safeErr(res)) || "List failed");
  return res.json();
}

export async function getRecord(id: number): Promise<InscriptionRecord | null> {
  if (isDemo) return demoGet(id);
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
