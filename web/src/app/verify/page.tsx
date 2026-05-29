"use client";

import { useCallback, useRef, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { PageHeader, Spinner, ErrorNote } from "@/components/ui";
import { Certificate } from "@/components/Certificate";
import { registryContract } from "@/lib/contract";
import type { Inscription } from "@/lib/contract";
import type { IndexedInscription } from "@/lib/useRegistry";
import { hashFile, shorten } from "@/lib/hash";
import { isContractConfigured, contractAddress } from "@/lib/config";

type Status = "idle" | "hashing" | "checking" | "hit" | "miss" | "error";

const inscribedEvent = parseAbiItem(
  "event Inscribed(uint256 indexed id, bytes32 indexed contentHash, address indexed owner, string cid, uint256 timestamp)"
);

export default function VerifyPage() {
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<Status>("idle");
  const [hash, setHash] = useState<string>("");
  const [record, setRecord] = useState<IndexedInscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = useCallback(
    async (file: File) => {
      if (!publicClient) return;
      setError(null);
      setRecord(null);
      setFileName(file.name);
      try {
        setStatus("hashing");
        const contentHash = await hashFile(file);
        setHash(contentHash);

        setStatus("checking");
        const [exists, rec] = (await publicClient.readContract({
          ...registryContract,
          functionName: "verify",
          args: [contentHash],
        })) as [boolean, Inscription];

        if (!exists) {
          setStatus("miss");
          return;
        }

        // Resolve the id via the indexed event (cheap; contentHash is indexed).
        let id = 0n;
        try {
          const logs = await publicClient.getLogs({
            address: contractAddress,
            event: inscribedEvent,
            args: { contentHash },
            fromBlock: 0n,
            toBlock: "latest",
          });
          if (logs[0]?.args.id !== undefined) id = logs[0].args.id as bigint;
        } catch {
          /* fall back to id 0 if the RPC rejects wide ranges */
        }

        setRecord({ ...rec, id });
        setStatus("hit");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed.");
        setStatus("error");
      }
    },
    [publicClient]
  );

  const busy = status === "hashing" || status === "checking";

  return (
    <div>
      <PageHeader
        title="Verify"
        subtitle="Upload a file to check whether it has been inscribed. Nothing is uploaded — the file is hashed locally and the hash is checked against the registry."
      />

      {!isContractConfigured && (
        <ErrorNote message="Contract address not configured (NEXT_PUBLIC_CONTRACT_ADDRESS)." />
      )}

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
