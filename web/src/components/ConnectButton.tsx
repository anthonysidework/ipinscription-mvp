"use client";

import { useWallet } from "@/lib/wallet";
import { shorten } from "@/lib/hash";
import { isDemo } from "@/lib/demo";

/** Connect / disconnect control for the Bitcoin wallet (or the demo wallet). */
export function ConnectButton() {
  const { isConnected, ordinalsAddress, connect, disconnect, connecting } =
    useWallet();

  if (isConnected && ordinalsAddress) {
    return (
      <button onClick={disconnect} className="btn-ghost" title={ordinalsAddress}>
        <span className="h-2 w-2 rounded-full bg-accent-400" />
        {shorten(ordinalsAddress, 6, 5)}
      </button>
    );
  }

  return (
    <button onClick={connect} className="btn-primary" disabled={connecting}>
      {connecting
        ? "Connecting…"
        : isDemo
          ? "Connect (demo)"
          : "Connect Wallet"}
    </button>
  );
}
