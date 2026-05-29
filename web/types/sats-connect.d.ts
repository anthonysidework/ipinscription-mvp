/**
 * Ambient type declaration for the subset of `sats-connect` (v4.2.x) this app uses.
 *
 * Why this exists: sats-connect ships its type declarations behind the
 * package.json `exports` map in an ESM-only form that the Next.js build type
 * checker does not reliably resolve (it fails with "Cannot find module
 * 'sats-connect'"). Declaring the exact surface we rely on here makes the build
 * deterministic across toolchains. The real package is used at runtime; this only
 * describes its types. Enum values verified against the installed 4.2.1 runtime.
 */
declare module "sats-connect" {
  export enum BitcoinNetworkType {
    Mainnet = "Mainnet",
    Testnet = "Testnet",
    Testnet4 = "Testnet4",
    Signet = "Signet",
    Regtest = "Regtest",
  }

  export enum AddressPurpose {
    Ordinals = "ordinals",
    Payment = "payment",
    Stacks = "stacks",
  }

  export interface BitcoinNetwork {
    type: BitcoinNetworkType;
    address?: string;
  }

  export interface Address {
    address: string;
    publicKey: string;
    purpose: AddressPurpose;
  }

  export interface GetAddressResponse {
    addresses: Address[];
  }

  export interface GetAddressOptions {
    payload: {
      purposes: AddressPurpose[];
      message: string;
      network: BitcoinNetwork;
    };
    onFinish: (response: GetAddressResponse) => void;
    onCancel: () => void;
  }

  export function getAddress(options: GetAddressOptions): Promise<void>;

  export interface CreateInscriptionResponse {
    txId: string;
  }

  export interface CreateInscriptionOptions {
    payload: {
      contentType: string;
      content: string;
      payloadType: "PLAIN_TEXT" | "BASE_64";
      network?: BitcoinNetwork;
      appFeeAddress?: string;
      appFee?: number;
      suggestedMinerFeeRate?: number;
    };
    onFinish: (response: CreateInscriptionResponse) => void;
    onCancel: () => void;
  }

  export function createInscription(
    options: CreateInscriptionOptions
  ): Promise<void>;
}
