/**
 * Central, env-driven configuration. All values come from NEXT_PUBLIC_* vars so
 * they are available in the browser. The Pinata JWT is intentionally NOT here —
 * it stays server-side (see src/app/api/ipfs). See .env.example.
 */
import { baseSepolia, sepolia } from "wagmi/chains";
import type { Chain } from "viem";

const SUPPORTED: Record<number, Chain> = {
  [baseSepolia.id]: baseSepolia,
  [sepolia.id]: sepolia,
};

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? baseSepolia.id);

export const activeChain: Chain = SUPPORTED[chainId] ?? baseSepolia;

/** Address of the deployed IPInscriptionRegistry on `activeChain`. */
export const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "") as `0x${string}`;

/** Optional custom RPC (e.g. Alchemy). Falls back to the chain's public RPC. */
export const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || undefined;

/** Public IPFS gateway used to render/download pinned content. */
export const ipfsGateway = (
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/"
).replace(/\/?$/, "/");

/** WalletConnect Cloud project id (required by RainbowKit). */
export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const isContractConfigured =
  /^0x[a-fA-F0-9]{40}$/.test(contractAddress);

/** Build a gateway URL from a CID or an ipfs:// URI. */
export function ipfsToHttp(cidOrUri: string): string {
  if (!cidOrUri) return "";
  const cid = cidOrUri.replace(/^ipfs:\/\//, "");
  return `${ipfsGateway}${cid}`;
}

/** Block-explorer base URL for the active chain. */
export function explorerUrl(): string {
  return activeChain.blockExplorers?.default.url ?? "https://basescan.org";
}

export function explorerTxUrl(hash: string): string {
  return `${explorerUrl()}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${explorerUrl()}/address/${address}`;
}
