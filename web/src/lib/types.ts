/** Shared types for the app-operated registry index. */

/** A single inscription record stored in our index. */
export type InscriptionRecord = {
  /** Sequential id assigned by our registry (0-based). */
  id: number;
  /** SHA-256 of the file bytes, 0x-prefixed hex. The registry key. */
  contentHash: string;
  /** IPFS CID of the original file (or a synthetic id in demo mode). */
  cid: string;
  /** IPFS URI of the metadata JSON (or a synthetic id in demo mode). */
  metadataURI: string;
  /** Creator's Bitcoin ordinals address. */
  owner: string;
  /** Bitcoin txid of the reveal/commit transaction. */
  txid: string;
  /** Ordinals inscription id ("<txid>i<index>") when known. */
  inscriptionId?: string;
  /** Bitcoin network the inscription was made on. */
  network: string;
  /** Unix seconds when the record was added to the registry. */
  timestamp: number;
  /** User-supplied metadata (denormalized for fast list/detail rendering). */
  title: string;
  description?: string;
  type?: string;
  fileName?: string;
  mimeType?: string;
  /**
   * Demo-only: a data URL of the file kept locally so the demo can preview it
   * without IPFS. Never set in real mode.
   */
  dataUrl?: string;
  /** True when this record was produced by the simulated demo flow. */
  demo?: boolean;
};

/** Payload accepted by POST /api/registry to add a record. */
export type AddRecordInput = Omit<InscriptionRecord, "id" | "timestamp">;
