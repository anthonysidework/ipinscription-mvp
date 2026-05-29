import Link from "next/link";
import { networkLabel } from "@/lib/config";
import { isDemo } from "@/lib/demo";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center gap-12 py-10 text-center">
      <div className="max-w-2xl">
        <span className="pill mx-auto mb-5">
          On-chain proof of authorship · {networkLabel}
          {isDemo ? " · demo" : " · Ordinals"}
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Inscribe your IP.
          <br />
          <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
            Prove you made it first.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-ink-100/70">
          Upload any file and inscribe it onto Bitcoin as a verifiable,
          timestamped, tamper-proof record of authorship. Your content is hashed
          locally with SHA-256, pinned to IPFS, and inscribed on-chain via your
          Bitcoin wallet — anyone can verify it.
        </p>
        {isDemo && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-amber-200/80">
            You&apos;re in <span className="font-medium">demo mode</span>: try the
            entire flow right now — no wallet, no funds, no setup. Hashing is real;
            the inscription is simulated and saved in your browser.
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/app" className="btn-primary px-6 py-3 text-base">
            Launch App
          </Link>
          <Link href="/verify" className="btn-ghost px-6 py-3 text-base">
            Verify a file
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-3xl gap-4 text-left sm:grid-cols-3">
        {[
          {
            t: "1 · Hash",
            d: "Your file is hashed with SHA-256 in your browser. The bytes never leave your control unless you choose to pin them.",
          },
          {
            t: "2 · Pin",
            d: "The file and a small metadata record are pinned to IPFS so the content stays retrievable.",
          },
          {
            t: "3 · Inscribe",
            d: "An on-chain Ordinals inscription records the hash + IPFS pointers on Bitcoin, with your address and a timestamp.",
          },
        ].map((s) => (
          <div key={s.t} className="card p-5">
            <p className="text-sm font-semibold text-brand-400">{s.t}</p>
            <p className="mt-2 text-sm text-ink-100/70">{s.d}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-100/40">
        {isDemo
          ? "Demo · simulated inscriptions · not legal advice"
          : "Testnet only · experimental · not legal advice"}
      </p>
    </div>
  );
}
