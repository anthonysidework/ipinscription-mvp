"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader, Spinner, ErrorNote, EmptyState } from "@/components/ui";
import { Certificate } from "@/components/Certificate";
import { useInscription } from "@/lib/useRegistry";
import { useTotal } from "@/lib/useRegistry";
import { isContractConfigured } from "@/lib/config";

export default function InscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const parsed = /^\d+$/.test(id) ? BigInt(id) : undefined;

  const { data: total } = useTotal();
  const inRange =
    parsed !== undefined && total !== undefined ? parsed < total : true;

  const { record, isLoading, error } = useInscription(
    inRange ? parsed : undefined
  );

  return (
    <div>
      <PageHeader
        title={`Inscription #${id}`}
        subtitle="On-chain certificate of authorship."
        action={
          <Link href="/explore" className="btn-ghost">
            ← Explore
          </Link>
        }
      />

      {!isContractConfigured ? (
        <ErrorNote message="Contract address not configured (NEXT_PUBLIC_CONTRACT_ADDRESS)." />
      ) : parsed === undefined ? (
        <ErrorNote message="Invalid inscription id." />
      ) : !inRange ? (
        <EmptyState
          title="Not found"
          description={`No inscription with id #${id} exists on the registry.`}
        />
      ) : error ? (
        <ErrorNote message="Failed to load this inscription from chain." />
      ) : isLoading || !record ? (
        <div className="flex items-center gap-2 text-sm text-ink-100/60">
          <Spinner /> Loading certificate…
        </div>
      ) : (
        <Certificate rec={record} />
      )}
    </div>
  );
}
