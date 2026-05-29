/**
 * Browser-local registry for DEMO MODE.
 *
 * Mirrors the server registry's API but stores records in the visitor's own
 * localStorage, so the demo needs no backend, no keys, and no shared state. Each
 * visitor sees their own registry. All functions are async to match the real
 * registryClient signatures.
 */
import type { InscriptionRecord, AddRecordInput } from "./types";

const KEY = "ip-demo-registry";

function read(): InscriptionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InscriptionRecord[]) : [];
  } catch {
    return [];
  }
}

function write(records: InscriptionRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // Likely a quota error from a large data URL — drop the preview and retry.
    try {
      const slim = records.map((r) => ({ ...r, dataUrl: undefined }));
      window.localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {
      /* give up silently; record just won't persist */
    }
  }
}

export async function demoAdd(input: AddRecordInput): Promise<InscriptionRecord> {
  const records = read();
  const existing = records.find(
    (r) => r.contentHash.toLowerCase() === input.contentHash.toLowerCase()
  );
  if (existing) return existing;

  const record: InscriptionRecord = {
    ...input,
    id: records.length,
    timestamp: Math.floor(Date.now() / 1000),
  };
  records.push(record);
  write(records);
  return record;
}

export async function demoVerify(
  hash: string
): Promise<{ exists: boolean; record: InscriptionRecord | null }> {
  const record =
    read().find((r) => r.contentHash.toLowerCase() === hash.toLowerCase()) ??
    null;
  return { exists: !!record, record };
}

export async function demoList(
  offset: number,
  limit: number
): Promise<{ total: number; records: InscriptionRecord[] }> {
  const all = read();
  const records = [...all].reverse().slice(offset, offset + limit);
  return { total: all.length, records };
}

export async function demoListByOwner(
  owner: string
): Promise<InscriptionRecord[]> {
  return read()
    .filter((r) => r.owner.toLowerCase() === owner.toLowerCase())
    .sort((a, b) => b.id - a.id);
}

export async function demoGet(id: number): Promise<InscriptionRecord | null> {
  return read().find((r) => r.id === id) ?? null;
}
