"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet";
import { PageHeader } from "@/components/ui";
import { ConnectButton } from "@/components/ConnectButton";
import { networkLabel } from "@/lib/config";
import { listByOwner, listRecords } from "@/lib/registryClient";

export default function DashboardPage() {
  const { isConnected, ordinalsAddress } = useWallet();
  const [total, setTotal] = useState<number | null>(null);
  const [mine, setMine] = useState<number | null>(null);

  useEffect(() => {
    listRecords(0, 1)
      .then((r) => setTotal(r.total))
      .catch(() => setTotal(null));
  }, []);

  useEffect(() => {
    if (!ordinalsAddress) {
      setMine(null);
      return;
    }
    listByOwner(ordinalsAddress)
      .then((r) => setMine(r.length))
      .catch(() => setMine(null));
  }, [ordinalsAddress]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Inscribe and manage your proofs of authorship on ${networkLabel}.`}
      />

      {!isConnected ? (
        <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
          <p className="text-white">Connect your Bitcoin wallet to get started.</p>
          <ConnectButton />
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Registry total" value={total?.toString() ?? "—"} />
            <Stat label="Your inscriptions" value={mine?.toString() ?? "—"} />
            <Stat label="Network" value={networkLabel} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ActionCard
              href="/inscribe"
              title="Inscribe new IP"
              desc="Upload a file, hash it, pin to IPFS, and inscribe it on Bitcoin."
              cta="Start inscribing →"
              primary
            />
            <ActionCard
              href="/me"
              title="My Inscriptions"
              desc="View every record tied to your connected address."
              cta="View mine →"
            />
            <ActionCard
              href="/explore"
              title="Explore registry"
              desc="Browse all public inscriptions made through the app."
              cta="Explore →"
            />
            <ActionCard
              href="/verify"
              title="Verify a file"
              desc="Check whether a file has already been inscribed."
              cta="Verify →"
            />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-ink-100/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  title,
  desc,
  cta,
  primary,
}: {
  href: string;
  title: string;
  desc: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card flex flex-col gap-2 p-6 transition-colors hover:border-brand-500/60 ${
        primary ? "ring-1 ring-brand-500/30" : ""
      }`}
    >
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="text-sm text-ink-100/60">{desc}</p>
      <span className="mt-2 text-sm text-brand-400">{cta}</span>
    </Link>
  );
}
