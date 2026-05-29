"use client";

import type { ReactNode } from "react";
import { useWallet } from "@/lib/wallet";
import { networkLabel } from "@/lib/config";
import { EmptyState } from "./ui";
import { ConnectButton } from "./ConnectButton";

/**
 * Wraps wallet-gated content. With Bitcoin there is no "wrong network" switch at
 * the dapp level (the wallet picks the network we request), so we only guard the
 * not-connected state.
 */
export function WalletGate({ children }: { children: ReactNode }) {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <EmptyState
        title="Connect your wallet"
        description={`Connect a Bitcoin wallet (Xverse) on ${networkLabel} to continue.`}
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
