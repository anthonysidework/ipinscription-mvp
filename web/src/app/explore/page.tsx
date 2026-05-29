"use client";

import { useMemo, useState } from "react";
import { PageHeader, EmptyState, Spinner, ErrorNote } from "@/components/ui";
import { InscriptionCard } from "@/components/InscriptionCard";
import { useTotal, useInscriptionsByIds } from "@/lib/useRegistry";
import { isContractConfigured } from "@/lib/config";

const PAGE_SIZE = 9;

export default function ExplorePage() {
  const { data: total, isLoading: totalLoading, error } = useTotal();
  const [page, setPage] = useState(0);

  const count = total ? Number(total) : 0;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // Show newest first: ids count-1 .. 0, sliced to the page.
  const ids = useMemo(() => {
    if (!count) return [];
    const start = count - 1 - page * PAGE_SIZE;
    const out: bigint[] = [];
    for (let i = start; i > start - PAGE_SIZE && i >= 0; i--) {
      out.push(BigInt(i));
    }
    return out;
  }, [count, page]);

  const { records, isLoading } = useInscriptionsByIds(ids);

  return (
    <div>
      <PageHeader
        title="Explore"
        subtitle="The full public registry of inscriptions on the contract."
      />

      {!isContractConfigured ? (
        <ErrorNote message="Contract address not configured (NEXT_PUBLIC_CONTRACT_ADDRESS)." />
      ) : error ? (
        <ErrorNote message="Failed to read the registry from chain." />
      ) : totalLoading ? (
        <div className="flex items-center gap-2 text-sm text-ink-100/60">
          <Spinner /> Loading registry…
        </div>
      ) : count === 0 ? (
        <EmptyState
          title="Registry is empty"
          description="No inscriptions have been recorded yet. Be the first."
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between text-sm text-ink-100/60">
            <span>{count} total inscriptions</span>
            <span>
              Page {page + 1} / {pageCount}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-ink-100/60">
              <Spinner /> Loading page…
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {records?.map((rec) => (
                <InscriptionCard key={rec.id.toString()} rec={rec} />
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              className="btn-ghost"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Newer
            </button>
            <button
              className="btn-ghost"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Older →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
