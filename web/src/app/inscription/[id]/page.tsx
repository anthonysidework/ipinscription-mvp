"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Spinner, ErrorNote, EmptyState } from "@/components/ui";
import { Certificate } from "@/components/Certificate";
import { getRecord } from "@/lib/registryClient";
import type { InscriptionRecord } from "@/lib/types";

export default function InscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const valid = /^\d+$/.test(id);

  const [record, setRecord] = useState<InscriptionRecord | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">(
    valid ? "loading" : "error"
  );

  useEffect(() => {
    if (!valid) return;
    getRecord(Number(id))
      .then((r) => {
        if (!r) setStatus("missing");
        else {
          setRecord(r);
          setStatus("ok");
        }
      })
      .catch(() => setStatus("error"));
  }, [id, valid]);

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

      {!valid ? (
        <ErrorNote message="Invalid inscription id." />
      ) : status === "missing" ? (
        <EmptyState
          title="Not found"
          description={`No inscription with id #${id} exists in the registry.`}
        />
      ) : status === "error" ? (
        <ErrorNote message="Failed to load this inscription." />
      ) : status === "loading" || !record ? (
        <div className="flex items-center gap-2 text-sm text-ink-100/60">
          <Spinner /> Loading certificate…
        </div>
      ) : (
        <Certificate rec={record} />
      )}
    </div>
  );
}
