/**
 * Client-side content hashing. We hash the raw file bytes with keccak256 — the
 * same hash the contract stores — so a file can later be verified byte-for-byte.
 */
import { keccak256, toHex } from "viem";

/** Compute keccak256 over the full bytes of a File/Blob. Returns 0x-prefixed hex. */
export async function hashFile(file: File | Blob): Promise<`0x${string}`> {
  const buf = await file.arrayBuffer();
  return keccak256(new Uint8Array(buf));
}

/** keccak256 of an arbitrary UTF-8 string (used for metadata if ever needed). */
export function hashString(value: string): `0x${string}` {
  return keccak256(toHex(value));
}

/** Short, human-friendly rendering of a 0x hash or address. */
export function shorten(hex: string, head = 6, tail = 4): string {
  if (!hex) return "";
  if (hex.length <= head + tail + 2) return hex;
  return `${hex.slice(0, head + 2)}…${hex.slice(-tail)}`;
}
