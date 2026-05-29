# IP Inscription — MVP (Bitcoin Ordinals)

Inscribe a piece of IP onto **Bitcoin** and get a verifiable, timestamped,
tamper-proof proof of authorship that anyone can independently verify.

This is a real, working MVP on a Bitcoin test network (**Signet** by default):
real wallet, real client-side hashing, real IPFS storage, real on-chain Ordinals
inscriptions.

> ⚠️ **Testnet only. Experimental.** No legal claim of IP ownership is made — an
> inscription records that an address committed a content hash to Bitcoin at a
> point in time. Not legal advice.

---

## The core loop

1. **Connect wallet** — connect a Bitcoin wallet (Xverse) on a test network.
2. **Inscribe** — upload a file + title (optional description/type). The app:
   - hashes the file locally (**SHA-256** over the bytes),
   - pins the file to IPFS (→ CID),
   - pins a metadata JSON (title, description, type, contentHash) to IPFS,
   - **inscribes a compact JSON proof** (hash + IPFS pointers) onto Bitcoin via
     your wallet,
   - records it in the app registry and shows a **Certificate of Inscription**
     with live links to the Bitcoin transaction.
3. **My Inscriptions** — your records, by connected address.
4. **Explore** — the public registry of inscriptions made through the app.
5. **Verify** — upload any file; it's hashed locally and checked against the
   registry. Hit → provenance record (owner, time, tx, CID); miss → "no record
   found".

### Why an app-operated registry?

Bitcoin has no smart-contract state, so there is no on-chain map of
"inscriptions made through this app" to enumerate or look up by file hash. The
**inscriptions themselves are real and fully on-chain**; to make them *searchable*
(Explore, Verify-by-hash, My Inscriptions) the app keeps its own index keyed by
content hash. The index stores only the hash + IPFS pointers + Bitcoin txid — it
does not custody anything.

> Looking for the smart-contract version? An earlier EVM build (Solidity registry
> on Base Sepolia, with Foundry tests) is preserved on the **`evm-version`** git
> branch. The Bitcoin model intentionally cannot do programmable royalties /
> tokenization — those require an EVM chain (a possible future direction).

---

## Repository layout

```
ipinscription-mvp/
├─ web/                         Next.js app (App Router + sats-connect + IPFS)
│  ├─ src/app/                  pages: /, /app, /inscribe, /me, /explore,
│  │                            /verify, /inscription/[id]
│  ├─ src/app/api/ipfs/         server-side Pinata pinning (keeps JWT secret)
│  ├─ src/app/api/registry/     app-operated registry index API
│  ├─ src/lib/                  config, hashing, wallet, ipfs, registry
│  ├─ src/components/
│  ├─ types/sats-connect.d.ts   ambient types for a deterministic build
│  └─ .env.example
├─ contracts/                   EVM contract (kept for reference; not used by the
│                               Bitcoin app — see the evm-version branch)
└─ README.md
```

---

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Wallet:** [sats-connect](https://github.com/secretkeylabs/sats-connect) (Xverse and compatible)
- **Network:** Bitcoin **Signet** (also: Testnet, Testnet4, Regtest, Mainnet)
- **Hashing:** SHA-256 via Web Crypto (no deps)
- **IPFS:** Pinata (JWT used server-side via API routes)
- **Registry index:** Upstash Redis (KV) in production · local JSON file in dev

---

## Prerequisites

| What | Where | Used for |
|------|-------|----------|
| Xverse wallet | https://www.xverse.app | connecting + inscribing |
| Signet BTC | faucet (below) | paying inscription miner fees |
| Pinata JWT | https://app.pinata.cloud → API Keys → New Key (JWT) | pinning files/metadata |
| Upstash Redis (KV) | https://console.upstash.com (for Vercel) | durable registry index |
| Node.js 20+ | https://nodejs.org | running the app |

### Signet BTC faucets
- https://signetfaucet.com
- https://faucet.mutinynet.com (if using the Mutinynet signet variant)

In Xverse, switch the network to **Signet** (Settings → Network) before connecting.

---

## Run locally

```bash
cd web
cp .env.example .env.local      # then edit it (see below)
npm install
npm run dev                     # http://localhost:3000
```

Minimum `web/.env.local` to run locally (registry falls back to a local file):

```ini
NEXT_PUBLIC_BTC_NETWORK=Signet
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
PINATA_JWT=<your pinata jwt>
# UPSTASH_* optional in dev — omit to use web/.registry/registry.json
```

### Walk the full loop
1. Open the app → **Launch App** → **Connect Wallet** (Xverse on Signet).
2. **Inscribe** a file: drag it in, add a title, click *Inscribe on Bitcoin*.
   Approve in Xverse. Watch the stages (hash → pin file → pin metadata → inscribe
   → index) and the resulting **Certificate** with a live mempool.space tx link.
3. Find it under **My Inscriptions** and in **Explore**.
4. Go to **Verify**, upload the *same* file → match found. Upload a *different*
   file → "no record found".

---

## Deploy to Vercel

The app is a standard Next.js project and deploys natively on Vercel — the
`/api/*` routes become serverless functions (so `PINATA_JWT` stays server-side).

1. **Push to GitHub**, then in Vercel: **New Project → import the repo**.
2. **Set Root Directory = `web`** (this is a monorepo; the app lives in `web/`).
   Framework preset auto-detects as Next.js.
3. **Create an Upstash Redis (KV) store** for the registry index — either via the
   Vercel Marketplace (Storage tab) or at console.upstash.com — and note its REST
   URL + token.
4. **Add Environment Variables** (Project → Settings → Environment Variables):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_BTC_NETWORK` | `Signet` |
   | `NEXT_PUBLIC_IPFS_GATEWAY` | `https://gateway.pinata.cloud/ipfs/` |
   | `PINATA_JWT` | your Pinata JWT (server-side) |
   | `UPSTASH_REDIS_REST_URL` | from Upstash |
   | `UPSTASH_REDIS_REST_TOKEN` | from Upstash |
   | `NEXT_PUBLIC_APP_FEE_SATS` | `0` (optional) |
   | `NEXT_PUBLIC_APP_FEE_ADDRESS` | empty (optional) |

5. **Deploy.** The local-file registry fallback is dev-only; on Vercel the Upstash
   KV store is used automatically when those two env vars are present.

> Note: a Vercel serverless filesystem is ephemeral, so the local JSON registry
> driver will **not** persist there. Configure Upstash for any deployed instance.

---

## API surface (registry index)

All server-side, under `/api/registry`:

| Method & path | Purpose |
|---------------|---------|
| `GET /api/registry?offset=&limit=` | newest-first page + total |
| `POST /api/registry` | add a record after a successful inscription |
| `GET /api/registry/verify?hash=` | look up by content hash (Verify) |
| `GET /api/registry/owner?address=` | records for an address (My Inscriptions) |
| `GET /api/registry/[id]` | a single record (detail page) |

Plus IPFS pinning: `POST /api/ipfs/file`, `POST /api/ipfs/json`.

---

## Notes & design choices

- **Secrets stay server-side.** Pinata pinning runs in `/api/ipfs/*`; the registry
  in `/api/registry/*`. Only `NEXT_PUBLIC_*` values reach the browser.
- **First-writer-wins.** A content hash can be inscribed once (the registry rejects
  duplicates by returning the existing record), which is what makes an inscription
  a meaningful proof of priority.
- **Small on-chain footprint.** The Bitcoin inscription carries only a compact JSON
  proof (hash + IPFS pointers); the file itself lives on IPFS.
- **Graceful states:** not connected, wallet missing, inscription cancelled, IPFS
  failure, empty lists, loading, and 404 detail are all handled. Mobile-responsive.
- **Phase-2 monetization hook:** set `NEXT_PUBLIC_APP_FEE_SATS` + `_ADDRESS` to add
  a flat per-inscription fee paid to your address via sats-connect's `appFee`.
