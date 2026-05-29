/**
 * Client-side content hashing. For the Bitcoin build we use SHA-256 (Bitcoin's
 * native hash) over the raw file bytes, computed in the browser with the Web
 * Crypto API — no dependencies. The same hash keys the registry index, so a file
 * can later be verified byte-for-byte.
 */

/** Compute SHA-256 over the full bytes of a File/Blob. Returns 0x-prefixed hex. */
export async function hashFile(file: File | Blob): Promise<`0x${string}`> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return toHex(new Uint8Array(digest));
}

/** SHA-256 of a UTF-8 string. */
export async function hashString(value: string): Promise<`0x${string}`> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

function toHex(bytes: Uint8Array): `0x${string}` {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return `0x${out}`;
}

/** Short, human-friendly rendering of a hash / address / txid. */
export function shorten(value: string, head = 6, tail = 4): string {
  if (!value) return "";
  const hasPrefix = value.startsWith("0x");
  const body = hasPrefix ? value.slice(2) : value;
  if (body.length <= head + tail) return value;
  const prefix = hasPrefix ? "0x" : "";
  return `${prefix}${body.slice(0, head)}…${body.slice(-tail)}`;
}
