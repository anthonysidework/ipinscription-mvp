/** Shared types for the app-operated registry index. */

/** A single inscription record stored in our index. */
export type InscriptionRecord = {
  /** Sequential id assigned by our registry (0-based). */
  id: number;
  /** SHA-256 of the file bytes, 0x-prefixed hex. The registry key. */
  contentHash: string;
  /** IPFS CID of the original file. */
  cid: string;
  /** IPFS URI of the metadata JSON. */
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
};

/** Payload accepted by POST /api/registry to add a record. */
export type AddRecordInput = Omit<InscriptionRecord, "id" | "timestamp">;
