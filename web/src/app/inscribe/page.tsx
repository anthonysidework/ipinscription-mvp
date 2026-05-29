"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { decodeEventLog } from "viem";
import { PageHeader, Spinner, ErrorNote, formatTimestamp } from "@/components/ui";
import { NetworkGuard } from "@/components/NetworkGuard";
import { Certificate } from "@/components/Certificate";
import { registryContract, registryAbi } from "@/lib/contract";
import type { IndexedInscription } from "@/lib/useRegistry";
import { hashFile, shorten } from "@/lib/hash";
import { pinFile, pinJson } from "@/lib/ipfs";

type Stage =
  | "idle"
  | "hashing"
  | "checking"
  | "uploading-file"
  | "uploading-meta"
  | "submitting"
  | "confirming"
  | "done"
  | "error";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "",
  hashing: "Hashing file (keccak256)…",
  checking: "Checking the registry for duplicates…",
  "uploading-file": "Pinning file to IPFS…",
  "uploading-meta": "Pinning metadata to IPFS…",
  submitting: "Awaiting wallet signature…",
  confirming: "Confirming transaction on-chain…",
  done: "Inscribed!",
  error: "Something went wrong",
};

const STEP_ORDER: Stage[] = [
  "hashing",
  "uploading-file",
  "uploading-meta",
  "submitting",
  "confirming",
  "done",
];

export default function InscribePage() {
  return (
    <div>
      <PageHeader
        title="Inscribe"
        subtitle="Upload a file to create a permanent, timestamped proof of authorship."
      />
      <NetworkGuard>
        <InscribeForm />
      </NetworkGuard>
    </div>
  );
}

function InscribeForm() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [dragging, setDragging] = useState(false);

  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [result, setResult] = useState<IndexedInscription | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const busy =
    stage !== "idle" && stage !== "done" && stage !== "error";

  const onPick = useCallback((f: File | null) => {
    setFile(f);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onPick(f);
    },
    [onPick]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim() || !publicClient || !address) return;
    setError(null);
    setResult(null);
    setTxHash(undefined);

    try {
      // 1. Hash locally.
      setStage("hashing");
      const contentHash = await hashFile(file);

      // 2. Pre-check the registry so we fail fast on duplicates.
      setStage("checking");
      const [exists] = (await publicClient.readContract({
        ...registryContract,
        functionName: "verify",
        args: [contentHash],
      })) as [boolean, unknown];
      if (exists) {
        throw new Error(
          "This exact file has already been inscribed. Each file can only be inscribed once."
        );
      }

      // 3. Pin the file.
      setStage("uploading-file");
      const { cid } = await pinFile(file);

      // 4. Pin the metadata JSON.
      setStage("uploading-meta");
      const { cid: metaCid } = await pinJson({
        title: title.trim(),
        description: description.trim() || undefined,
        type: type.trim() || undefined,
        contentHash,
        fileName: file.name,
        mimeType: file.type || undefined,
      });
      const metadataURI = `ipfs://${metaCid}`;

      // 5. Submit the transaction.
      setStage("submitting");
      const hash = await writeContractAsync({
        ...registryContract,
        functionName: "inscribe",
        args: [contentHash, cid, metadataURI],
      });
      setTxHash(hash);

      // 6. Wait for confirmation and pull the new id from the event log.
      setStage("confirming");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error("Transaction reverted on-chain.");
      }

      let newId: bigint | undefined;
      let blockTs: bigint | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: registryAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "Inscribed") {
            newId = decoded.args.id as bigint;
            blockTs = decoded.args.timestamp as bigint;
            break;
          }
        } catch {
          /* not our event */
        }
      }

      if (newId === undefined) {
        // Fallback: read total - 1.
        const total = (await publicClient.readContract({
          ...registryContract,
          functionName: "total",
        })) as bigint;
        newId = total - 1n;
      }
      if (blockTs === undefined) {
        const block = await publicClient.getBlock({
          blockNumber: receipt.blockNumber,
        });
        blockTs = block.timestamp;
      }

      setResult({
        id: newId,
        contentHash,
        cid,
        metadataURI,
        owner: address,
        timestamp: blockTs,
      });
      setStage("done");
    } catch (err) {
      setError(
        err instanceof Error ? humanizeError(err.message) : "Inscription failed."
      );
      setStage("error");
    }
  }

  function reset() {
    setFile(null);
    setTitle("");
    setDescription("");
    setType("");
    setStage("idle");
    setError(null);
    setTxHash(undefined);
    setResult(null);
  }

  if (stage === "done" && result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-accent-400">
          ✓ Inscribed on-chain at {formatTimestamp(result.timestamp)}.
        </div>
        <Certificate rec={result} txHash={txHash} />
        <div className="flex flex-wrap gap-3">
          <Link href={`/inscription/${result.id.toString()}`} className="btn-ghost">
            Open certificate page
          </Link>
          <button onClick={reset} className="btn-primary">
            Inscribe another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      {/* Upload + preview */}
      <div className="flex flex-col gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`card flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed px-6 py-12 text-center transition-colors ${
            dragging ? "border-brand-500 bg-brand-500/5" : "hover:border-brand-500/50"
          }`}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-800 text-xl">
            ⬆
          </div>
          {file ? (
            <>
              <p className="text-sm text-white">{file.name}</p>
              <p className="text-xs text-ink-100/50">
                {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}
              </p>
              <p className="text-xs text-brand-400">Click to choose a different file</p>
            </>
          ) : (
            <>
              <p className="text-sm text-white">Drag & drop a file here</p>
              <p className="text-xs text-ink-100/50">
                image, audio, video, pdf, text — anything
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="title">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            className="input"
            placeholder="e.g. Sunset over the bay"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="type">
            Type (optional)
          </label>
          <input
            id="type"
            className="input"
            placeholder="image / song / article / design…"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="desc">
            Description (optional)
          </label>
          <textarea
            id="desc"
            className="input min-h-24"
            placeholder="A short description of this work."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={!file || !title.trim() || busy}
        >
          {busy ? <Spinner /> : null}
          {busy ? STAGE_LABELS[stage] : "Inscribe on-chain"}
        </button>

        {busy && <ProgressSteps stage={stage} />}
        {txHash && (
          <p className="text-xs text-ink-100/50">tx {shorten(txHash, 10, 8)}</p>
        )}
        {error && <ErrorNote message={error} />}
      </div>
    </form>
  );
}

function ProgressSteps({ stage }: { stage: Stage }) {
  const currentIndex = STEP_ORDER.indexOf(
    stage === "checking" ? "hashing" : stage
  );
  return (
    <ol className="flex flex-col gap-2">
      {STEP_ORDER.filter((s) => s !== "done").map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s} className="flex items-center gap-2 text-sm">
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-[0.65rem] ${
                done
                  ? "bg-accent-500 text-ink-950"
                  : active
                    ? "bg-brand-500 text-white"
                    : "bg-ink-800 text-ink-100/40"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={active ? "text-white" : "text-ink-100/50"}>
              {STAGE_LABELS[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function humanizeError(msg: string): string {
  if (/User rejected|denied|rejected the request/i.test(msg))
    return "Transaction rejected in wallet.";
  if (/already inscribed/i.test(msg))
    return "This exact file has already been inscribed.";
  if (/insufficient funds/i.test(msg))
    return "Insufficient testnet ETH to pay for gas. Use a faucet to top up.";
  return msg;
}
