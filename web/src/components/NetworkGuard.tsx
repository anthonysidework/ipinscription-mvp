"use client";

import type { ReactNode } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { activeChain, isContractConfigured, contractAddress } from "@/lib/config";
import { EmptyState, ErrorNote } from "./ui";

/**
 * Wraps wallet-gated content. Renders helpful states for: contract not
 * configured, wallet not connected, and wrong network (with a switch prompt).
 */
export function NetworkGuard({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isContractConfigured) {
    return (
      <ErrorNote
        message={`No contract configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in web/.env.local (currently "${
          contractAddress || "empty"
        }"), then restart the dev server.`}
      />
    );
  }

  if (!isConnected) {
    return (
      <EmptyState
        title="Connect your wallet"
        description={`Connect a wallet on ${activeChain.name} to continue.`}
        action={
          <div className="mt-2">
            <ConnectButton />
          </div>
        }
      />
    );
  }

  if (chainId !== activeChain.id) {
    return (
      <EmptyState
        title="Wrong network"
        description={`This app runs on ${activeChain.name}. Switch networks to continue.`}
        action={
          <button
            className="btn-primary mt-2"
            disabled={isPending}
            onClick={() => switchChain({ chainId: activeChain.id })}
          >
            {isPending ? "Switching…" : `Switch to ${activeChain.name}`}
          </button>
        }
      />
    );
  }

  return <>{children}</>;
}
