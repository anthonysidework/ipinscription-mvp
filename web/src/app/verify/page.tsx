"use client";

import { useCallback, useRef, useState } from "react";
import { PageHeader, Spinner, ErrorNote } from "@/components/ui";
import { Certificate } from "@/components/Certificate";
import { hashFile, shorten } from "@/lib/hash";
import { verifyByHash } from "@/lib/registryClient";
import type { InscriptionRecord } from "@/lib/types";

type Status = "idle" | "hashing" | "checking" | "hit" | "miss" | "error";

export default function VerifyPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [hash, setHash] = useState<string>("");
  const [record, setRecord] = useState<InscriptionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = useCallback(async (file: File) => {
    setError(null);
    setRecord(null);
    setFileName(file.name);
    try {
      setStatus("hashing");
      const contentHash = await hashFile(file);
      setHash(contentHash);

      setStatus("checking");
      const { exists, record } = await verifyByHash(contentHash);
      if (!exists || !record) {
        setStatus("miss");
        return;
      }
      setRecord(record);
      setStatus("hit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setStatus("error");
    }
  }, []);

  const busy = status === "hashing" || status === "checking";

  return (
    <div>
      <PageHeader
        title="Verify"
        subtitle="Upload a file to check whether it has been inscribed. The file is hashed locally (SHA-256) and the hash is checked against the registry — the file itself is not uploaded."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) run(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`card mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? "border-brand-500 bg-brand-500/5" : "hover:border-brand-500/50"
        }`}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-800 text-xl">
          🔍
        </div>
        <p className="text-sm text-white">
          {fileName ? `Re-check: ${fileName}` : "Drop a file to verify"}
        </p>
        <p className="text-xs text-ink-100/50">or click to choose</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) run(f);
          }}
        />
      </div>

      {busy && (
        <div className="mt-4 flex items-center gap-2 text-sm text-ink-100/60">
          <Spinner />
          {status === "hashing" ? "Hashing file…" : "Checking registry…"}
        </div>
      )}

      {hash && !busy && (
        <p className="mono mt-4 text-ink-100/50">hash {shorten(hash, 12, 10)}</p>
      )}

      {status === "error" && error && (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      )}

      {status === "miss" && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-6 text-center">
          <p className="text-lg font-semibold text-amber-200">No record found</p>
          <p className="mt-1 text-sm text-amber-200/70">
            This file has not been inscribed on the registry.
          </p>
        </div>
      )}

      {status === "hit" && record && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-xl border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-accent-400">
            ✓ Match found — this file is inscribed on-chain.
          </div>
          <Certificate rec={record} heading="Verified Inscription" />
        </div>
      )}
    </div>
  );
}
