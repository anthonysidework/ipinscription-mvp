/**
 * Central, env-driven configuration for the Bitcoin Ordinals build.
 *
 * Inscriptions are made on a Bitcoin test network (Signet by default) via the
 * Xverse wallet (sats-connect). Files are pinned to IPFS (Pinata, server-side).
 * Because Bitcoin has no contract state, the searchable registry is an
 * app-operated index (see lib/registry.ts) — inscriptions themselves are real
 * and on-chain; only the lookup layer is ours.
 */
import { BitcoinNetworkType } from "sats-connect";

/** The active Bitcoin network. Set via NEXT_PUBLIC_BTC_NETWORK. */
export const networkType: BitcoinNetworkType =
  (process.env.NEXT_PUBLIC_BTC_NETWORK as BitcoinNetworkType) ||
  BitcoinNetworkType.Signet;

export const isMainnet = networkType === BitcoinNetworkType.Mainnet;

/** Human label for the active network. */
export const networkLabel = (() => {
  switch (networkType) {
    case BitcoinNetworkType.Mainnet:
      return "Bitcoin Mainnet";
    case BitcoinNetworkType.Testnet:
      return "Bitcoin Testnet3";
    case BitcoinNetworkType.Testnet4:
      return "Bitcoin Testnet4";
    case BitcoinNetworkType.Signet:
      return "Bitcoin Signet";
    case BitcoinNetworkType.Regtest:
      return "Bitcoin Regtest";
    default:
      return String(networkType);
  }
})();

/** Public IPFS gateway used to render/download pinned content. */
export const ipfsGateway = (
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/"
).replace(/\/?$/, "/");

/** Optional flat app fee (in sats) added to each inscription — Phase 2 hook. */
export const appFeeSats = Number(process.env.NEXT_PUBLIC_APP_FEE_SATS || 0);
export const appFeeAddress = process.env.NEXT_PUBLIC_APP_FEE_ADDRESS || "";

/** Build a gateway URL from a CID or an ipfs:// URI. */
export function ipfsToHttp(cidOrUri: string): string {
  if (!cidOrUri) return "";
  const cid = cidOrUri.replace(/^ipfs:\/\//, "");
  return `${ipfsGateway}${cid}`;
}

/* --------------------------- block explorers --------------------------- */

/** mempool.space base URL for the active network (tx + address views). */
export function mempoolBase(): string {
  switch (networkType) {
    case BitcoinNetworkType.Mainnet:
      return "https://mempool.space";
    case BitcoinNetworkType.Testnet:
      return "https://mempool.space/testnet";
    case BitcoinNetworkType.Testnet4:
      return "https://mempool.space/testnet4";
    case BitcoinNetworkType.Signet:
      return "https://mempool.space/signet";
    default:
      return "https://mempool.space";
  }
}

export function explorerTxUrl(txid: string): string {
  return `${mempoolBase()}/tx/${txid}`;
}

export function explorerAddressUrl(address: string): string {
  return `${mempoolBase()}/address/${address}`;
}

/**
 * Ordinals explorer for an inscription id. ordinals.com only indexes mainnet;
 * for test networks we fall back to the funding tx on mempool, which is the most
 * reliable cross-network link.
 */
export function ordinalsUrl(inscriptionId: string): string {
  if (isMainnet) return `https://ordinals.com/inscription/${inscriptionId}`;
  const txid = inscriptionId.split("i")[0];
  return explorerTxUrl(txid);
}
