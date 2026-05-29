# IP Inscription — MVP

Inscribe a piece of IP on-chain and get a **verifiable, timestamped, tamper-proof
proof of authorship** that anyone can independently verify.

This is a real, working MVP on a public testnet (Base Sepolia by default):
real wallet, real client-side file hashing, real IPFS storage, real smart
contract, real transactions.

> ⚠️ **Testnet only. Unaudited. Not for production/mainnet.** The contract handles
> no funds and makes no legal claim of IP ownership — it records that an address
> submitted a content hash at a block timestamp.

---

## The core loop

1. **Connect wallet** on a testnet.
2. **Inscribe** — upload a file + title (optional description/type). The app:
   - hashes the file locally (`keccak256` over the bytes),
   - pins the file to IPFS (→ CID),
   - pins a metadata JSON (title, description, type, contentHash) to IPFS,
   - calls `inscribe(contentHash, cid, metadataURI)`,
   - shows live tx states and a **Certificate of Inscription** on success.
3. **My Inscriptions** — your records, read from chain.
4. **Explore** — the full public registry, paginated.
5. **Verify** — upload any file; it's hashed locally and checked against the
   registry. Hit → provenance record; miss → "no record found".

---

## Repository layout

```
ipinscription-mvp/
├─ contracts/        Foundry project (Solidity + tests + deploy script)
│  ├─ src/IPInscriptionRegistry.sol
│  ├─ test/IPInscriptionRegistry.t.sol
│  ├─ script/Deploy.s.sol
│  └─ .env.example
└─ web/              Next.js app (App Router + wagmi + viem + RainbowKit)
   ├─ src/app/...    pages: /, /app, /inscribe, /me, /explore, /verify, /inscription/[id]
   ├─ src/app/api/ipfs/...   server-side Pinata pinning (keeps JWT secret)
   ├─ src/lib/...    config, contract ABI, hashing, IPFS, wagmi, read hooks
   ├─ src/components/...
   └─ .env.example
```

---

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Wallet/chain:** wagmi + viem + RainbowKit
- **Testnet:** Base Sepolia (chain id `84532`); Sepolia (`11155111`) also supported
- **Contract:** Solidity `0.8.24`, built/tested/deployed with **Foundry**
- **IPFS:** Pinata (JWT used server-side via API routes)

---

## Prerequisites

You'll need a few free accounts/keys:

| What | Where | Used for |
|------|-------|----------|
| Testnet ETH | Base Sepolia faucet (below) | gas for inscribing + deploying |
| Alchemy RPC URL | https://dashboard.alchemy.com | chain reads/writes |
| Pinata JWT | https://app.pinata.cloud → API Keys → New Key (JWT) | pinning files/metadata |
| WalletConnect project id | https://cloud.walletconnect.com | RainbowKit wallet modal |
| A browser wallet | e.g. MetaMask / Rabby | connecting + signing |

### Base Sepolia faucets (testnet ETH)
- Coinbase: https://portal.cdp.coinbase.com/products/faucet
- Alchemy: https://www.alchemy.com/faucets/base-sepolia
- Or bridge Sepolia ETH via https://superbridge.app

Install [Foundry](https://book.getfoundry.sh/getting-started/installation):
```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
```
and [Node.js](https://nodejs.org) 20+.

---

## 1) Contract: build, test, deploy

```bash
cd contracts
forge build          # compile
forge test -vv       # run the full test suite (10 tests incl. fuzz)
```

Deploy to Base Sepolia:

```bash
cp .env.example .env
# edit .env: set BASE_SEPOLIA_RPC_URL, PRIVATE_KEY (a throwaway funded testnet key)
source .env

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$BASE_SEPOLIA_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast
# (add --verify --etherscan-api-key "$ETHERSCAN_API_KEY" to verify on Basescan)
```

Copy the printed `IPInscriptionRegistry deployed at: 0x…` address — you'll paste it
into the frontend env next.

### Contract API (`IPInscriptionRegistry.sol`)
- `inscribe(bytes32 contentHash, string cid, string metadataURI) → uint256 id`
  — reverts `"already inscribed"` on duplicate hash, `"invalid hash"` on zero hash.
- `verify(bytes32 contentHash) → (bool exists, Inscription record)`
- `getInscription(uint256 id) → Inscription`
- `getByOwner(address) → uint256[]`
- `total() → uint256`
- `event Inscribed(uint256 indexed id, bytes32 indexed contentHash, address indexed owner, string cid, uint256 timestamp)`

---

## 2) Frontend: configure + run

```bash
cd web
cp .env.example .env.local   # if you haven't already
```

Fill in `web/.env.local`:

```ini
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...   # the address from the deploy step
NEXT_PUBLIC_RPC_URL=https://base-sepolia.g.alchemy.com/v2/<ALCHEMY_KEY>
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<walletconnect_project_id>
PINATA_JWT=<server-side pinata jwt>   # never exposed to the browser
```

Run it:

```bash
npm install
npm run dev
# open http://localhost:3000
```

---

## 3) Walk the full loop

1. Open the app → **Launch App** → **Connect** your wallet (switch to Base Sepolia
   if prompted).
2. **Inscribe** a file: drag it in, add a title, click *Inscribe on-chain*. Watch
   the stages (hash → pin file → pin metadata → sign → confirm) and the resulting
   **Certificate**.
3. Find it under **My Inscriptions** and in **Explore**.
4. Go to **Verify**, upload the *same* file → match found (shows the record).
   Upload a *different* file → "no record found".

---

## Notes & design choices

- **Secrets stay server-side.** Pinata pinning runs in `/api/ipfs/*` route
  handlers, so `PINATA_JWT` is never shipped to the browser. Only `NEXT_PUBLIC_*`
  values reach the client.
- **First-writer-wins.** A content hash can be inscribed only once; that's what
  makes an inscription a meaningful proof of priority.
- **Reads are pure chain reads** via view functions (`total`, `getInscription`,
  `getByOwner`, `verify`) plus the indexed `Inscribed` event for id lookup in
  Verify. Explore is paginated.
- **Graceful states:** not connected, wrong network (with switch prompt),
  contract not configured, tx pending/success/error, IPFS upload failure, empty
  lists, and loading skeletons are all handled.
