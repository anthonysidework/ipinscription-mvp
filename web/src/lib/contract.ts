/**
 * Type-safe bindings for IPInscriptionRegistry. The ABI is declared `as const`
 * so wagmi/viem can fully infer argument and return types.
 */
import { contractAddress } from "./config";

export const registryAbi = [
  {
    type: "function",
    name: "inscribe",
    stateMutability: "nonpayable",
    inputs: [
      { name: "contentHash", type: "bytes32" },
      { name: "cid", type: "string" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "verify",
    stateMutability: "view",
    inputs: [{ name: "contentHash", type: "bytes32" }],
    outputs: [
      { name: "exists", type: "bool" },
      {
        name: "record",
        type: "tuple",
        components: [
          { name: "contentHash", type: "bytes32" },
          { name: "cid", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "owner", type: "address" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getInscription",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "contentHash", type: "bytes32" },
          { name: "cid", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "owner", type: "address" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getByOwner",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "total",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "Inscribed",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "contentHash", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "cid", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

export const registryContract = {
  address: contractAddress,
  abi: registryAbi,
} as const;

/** Decoded inscription record as returned by the contract. */
export type Inscription = {
  contentHash: `0x${string}`;
  cid: string;
  metadataURI: string;
  owner: `0x${string}`;
  timestamp: bigint;
};

/** Normalize a tuple/struct returned by viem into an Inscription with an id. */
export function toInscription(
  raw: {
    contentHash: `0x${string}`;
    cid: string;
    metadataURI: string;
    owner: `0x${string}`;
    timestamp: bigint;
  },
  id: bigint
): Inscription & { id: bigint } {
  return {
    id,
    contentHash: raw.contentHash,
    cid: raw.cid,
    metadataURI: raw.metadataURI,
    owner: raw.owner,
    timestamp: raw.timestamp,
  };
}
