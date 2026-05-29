/**
 * Demo-mode helpers.
 *
 * The app ships in DEMO MODE by default so anyone can open the deployed URL and
 * click the entire loop with no wallet extension, no Signet BTC, and no API keys:
 *   - SHA-256 hashing is REAL.
 *   - Wallet connect + Bitcoin inscription are SIMULATED (realistic-looking but
 *     fake txid / address).
 *   - Records persist in the visitor's own browser (localStorage), so Explore /
 *     My Inscriptions / Verify all work per-visitor.
 *
 * Flip to real Bitcoin Ordinals by setting NEXT_PUBLIC_DEMO_MODE=false (and
 * providing PINATA_JWT + optionally Upstash) — see .env.example.
 *
 * This module intentionally has NO imports (no sats-connect), so it is safe to
 * read from both server and client components.
 */

/** Demo mode is ON unless explicitly disabled. Zero-config deploy ⇒ demo. */
export const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

const BECH32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const HEX = "0123456789abcdef";

function randFrom(alphabet: string, len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** A realistic-looking (but fake) Signet taproot address: tb1p… */
export function fakeTaprootAddress(): string {
  return `tb1p${randFrom(BECH32, 58)}`;
}

/** A realistic-looking (but fake) 64-hex Bitcoin txid. */
export function fakeTxid(): string {
  return randFrom(HEX, 64);
}

/** Max file size we'll inline as a data URL for demo previews (~2 MB). */
export const DEMO_PREVIEW_MAX_BYTES = 2_000_000;

/**
 * Read a small file into a data URL so the demo can preview it locally without
 * IPFS. Returns undefined for files too large to keep in localStorage.
 */
export function fileToDataUrl(file: File): Promise<string | undefined> {
  if (file.size > DEMO_PREVIEW_MAX_BYTES) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

/** Small artificial delay so simulated steps feel real. */
export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
