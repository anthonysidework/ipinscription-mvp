/**
 * wagmi + RainbowKit configuration. A single testnet chain is active at a time,
 * chosen via NEXT_PUBLIC_CHAIN_ID (see config.ts).
 */
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { activeChain, rpcUrl, walletConnectProjectId } from "./config";

export const wagmiConfig = getDefaultConfig({
  appName: "IP Inscription",
  projectId: walletConnectProjectId || "PLACEHOLDER_PROJECT_ID",
  chains: [activeChain],
  transports: {
    [activeChain.id]: http(rpcUrl),
  },
  ssr: true,
});
