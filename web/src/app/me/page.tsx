"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { PageHeader, EmptyState, Spinner, ErrorNote } from "@/components/ui";
import { NetworkGuard } from "@/components/NetworkGuard";
import { InscriptionCard } from "@/components/InscriptionCard";
import { useOwnerIds, useInscriptionsByIds } from "@/lib/useRegistry";

export default function MePage() {
  return (
    <div>
      <PageHeader
        title="My Inscriptions"
        subtitle="Every record tied to your connected address, read from chain."
        action={
          <Link href="/inscribe" className="btn-primary">
            + Inscribe
          </Link>
        }
      />
      <NetworkGuard>
        <MyList />
      </NetworkGuard>
    </div>
  );
}

function MyList() {
  const { address } = useAccount();
  const { data: ids, isLoading: idsLoading, error: idsError } = useOwnerIds(address);

  // Newest first.
  const ordered = ids ? [...ids].reverse() : undefined;
  const { records, isLoading } = useInscriptionsByIds(ordered);

  if (idsError) return <ErrorNote message="Failed to read from the contract." />;

  if (idsLoading || (ids && ids.length > 0 && isLoading)) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-100/60">
        <Spinner /> Loading your inscriptions…
      </div>
    );
  }

  if (!ids || ids.length === 0) {
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
      {records?.map((rec) => (
        <InscriptionCard key={rec.id.toString()} rec={rec} />
      ))}
    </div>
  );
}
