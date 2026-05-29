"use client";

import type { ReactNode } from "react";
import { useWallet } from "@/lib/wallet";
import { networkLabel } from "@/lib/config";
import { isDemo } from "@/lib/demo";
import { EmptyState } from "./ui";
import { ConnectButton } from "./ConnectButton";

/**
 * Wraps wallet-gated content. With Bitcoin there is no "wrong network" switch at
 * the dapp level (the wallet picks the network we request), so we only guard the
 * not-connected state. In demo mode connecting is instant and needs no extension.
 */
export function WalletGate({ children }: { children: ReactNode }) {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <EmptyState
        title="Connect your wallet"
        description={
          isDemo
            ? "Demo mode — click Connect for an instant simulated wallet. No extension or funds required."
            : `Connect a Bitcoin wallet (Xverse) on ${networkLabel} to continue.`
        }
        action={
          <div className="mt-2">
            <ConnectButton />
          </div>
        }
      />
    );
  }

  return <>{children}</>;
}
