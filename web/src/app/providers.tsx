"use client";

import type { ReactNode } from "react";
import { WalletProvider } from "@/lib/wallet";

/** Top-level client providers. Bitcoin wallet (sats-connect) context. */
export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
