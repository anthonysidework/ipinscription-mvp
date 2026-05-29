"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet";
import { PageHeader, EmptyState, Spinner, ErrorNote } from "@/components/ui";
import { WalletGate } from "@/components/WalletGate";
import { InscriptionCard } from "@/components/InscriptionCard";
import { listByOwner } from "@/lib/registryClient";
import type { InscriptionRecord } from "@/lib/types";

export default function MePage() {
  return (
    <div>
      <PageHeader
        title="My Inscriptions"
        subtitle="Every record tied to your connected address."
        action={
          <Link href="/inscribe" className="btn-primary">
            + Inscribe
          </Link>
        }
      />
      <WalletGate>
        <MyList />
      </WalletGate>
    </div>
  );
}

function MyList() {
  const { ordinalsAddress } = useWallet();
  const [records, setRecords] = useState<InscriptionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ordinalsAddress) return;
    setRecords(null);
    setError(null);
    listByOwner(ordinalsAddress)
      .then(setRecords)
      .catch((e) => setError(e.message));
  }, [ordinalsAddress]);

  if (error) return <ErrorNote message={error} />;

  if (records === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-100/60">
        <Spinner /> Loading your inscriptions…
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title="No inscriptions yet"
        description="Inscribe your first file to see it here."
        action={
          <Link href="/inscribe" className="btn-primary mt-2">
            Inscribe a file
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {records.map((rec) => (
        <InscriptionCard key={rec.id} rec={rec} />
      ))}
    </div>
  );
}
