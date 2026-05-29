"use client";

/**
 * Bitcoin wallet context using sats-connect (Xverse and compatible wallets).
 *
 * Exposes the connected ordinals + payment addresses and a `connect`/`disconnect`
 * pair, plus an `inscribe` helper that wraps `createInscription`. Connection is
 * persisted to localStorage so a refresh keeps the session.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAddress, createInscription, AddressPurpose } from "sats-connect";
import { networkType, appFeeSats, appFeeAddress } from "./config";

type WalletState = {
  ordinalsAddress: string | null;
  paymentAddress: string | null;
  isConnected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Inscribe content; resolves to the reveal txid. */
  inscribe: (args: {
    content: string;
    contentType: string;
    payloadType: "PLAIN_TEXT" | "BASE_64";
    feeRate?: number;
  }) => Promise<string>;
};

const STORAGE_KEY = "ip-wallet";

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [ordinalsAddress, setOrdinals] = useState<string | null>(null);
  const [paymentAddress, setPayment] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore a previous session.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.network === networkType) {
          setOrdinals(saved.ordinalsAddress ?? null);
          setPayment(saved.paymentAddress ?? null);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      await getAddress({
        payload: {
          purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
          message: "Connect to IP Inscription to inscribe and verify your work.",
          network: { type: networkType },
        },
        onFinish: (response) => {
          const ord = response.addresses.find(
            (a) => a.purpose === AddressPurpose.Ordinals
          );
          const pay = response.addresses.find(
            (a) => a.purpose === AddressPurpose.Payment
          );
          setOrdinals(ord?.address ?? null);
          setPayment(pay?.address ?? null);
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                network: networkType,
                ordinalsAddress: ord?.address ?? null,
                paymentAddress: pay?.address ?? null,
              })
            );
          } catch {
            /* ignore */
          }
        },
        onCancel: () => setError("Connection request was cancelled."),
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? humanize(e.message)
          : "Failed to connect. Is the Xverse wallet installed?"
      );
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setOrdinals(null);
    setPayment(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const inscribe = useCallback<WalletState["inscribe"]>(
    ({ content, contentType, payloadType, feeRate }) =>
      new Promise<string>((resolve, reject) => {
        createInscription({
          payload: {
            network: { type: networkType },
            content,
            contentType,
            payloadType,
            ...(appFeeSats > 0 && appFeeAddress
              ? { appFee: appFeeSats, appFeeAddress }
              : {}),
            ...(feeRate ? { suggestedMinerFeeRate: feeRate } : {}),
          },
          onFinish: (response) => resolve(response.txId),
          onCancel: () => reject(new Error("Inscription was cancelled.")),
        }).catch((e) =>
          reject(e instanceof Error ? new Error(humanize(e.message)) : e)
        );
      }),
    []
  );

  const value = useMemo<WalletState>(
    () => ({
      ordinalsAddress,
      paymentAddress,
      isConnected: !!ordinalsAddress,
      connecting,
      error,
      connect,
      disconnect,
      inscribe,
    }),
    [ordinalsAddress, paymentAddress, connecting, error, connect, disconnect, inscribe]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

function humanize(msg: string): string {
  if (/no bitcoin wallet|not found|undefined|provider/i.test(msg))
    return "No Bitcoin wallet detected. Install Xverse (xverse.app) and try again.";
  if (/cancel|reject|denied/i.test(msg)) return "Request cancelled in wallet.";
  return msg;
}
