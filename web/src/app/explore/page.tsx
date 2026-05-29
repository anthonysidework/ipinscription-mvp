"use client";

import { useEffect, useState } from "react";
import { PageHeader, EmptyState, Spinner, ErrorNote } from "@/components/ui";
import { InscriptionCard } from "@/components/InscriptionCard";
import { listRecords } from "@/lib/registryClient";
import type { InscriptionRecord } from "@/lib/types";

const PAGE_SIZE = 9;

export default function ExplorePage() {
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [records, setRecords] = useState<InscriptionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRecords(null);
    setError(null);
    listRecords(page * PAGE_SIZE, PAGE_SIZE)
      .then((r) => {
        setTotal(r.total);
        setRecords(r.records);
      })
      .catch((e) => setError(e.message));
  }, [page]);

  const pageCount = total ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader
        title="Explore"
        subtitle="The public registry of inscriptions made through the app."
      />

      {error ? (
        <ErrorNote message={error} />
      ) : records === null ? (
        <div className="flex items-center gap-2 text-sm text-ink-100/60">
          <Spinner /> Loading registry…
        </div>
      ) : total === 0 ? (
        <EmptyState
          title="Registry is empty"
          description="No inscriptions have been recorded yet. Be the first."
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between text-sm text-ink-100/60">
            <span>{total} total inscriptions</span>
            <span>
              Page {page + 1} / {pageCount}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((rec) => (
              <InscriptionCard key={rec.id} rec={rec} />
            ))}
          </div>

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
