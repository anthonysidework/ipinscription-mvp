"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/wallet";
import { PageHeader, Spinner, ErrorNote, formatTimestamp } from "@/components/ui";
import { WalletGate } from "@/components/WalletGate";
import { Certificate } from "@/components/Certificate";
import { hashFile, shorten } from "@/lib/hash";
import { pinFile, pinJson } from "@/lib/ipfs";
import { addRecord, verifyByHash } from "@/lib/registryClient";
import { networkType, networkLabel } from "@/lib/config";
import { isDemo, fileToDataUrl } from "@/lib/demo";
import type { InscriptionRecord } from "@/lib/types";

type Stage =
  | "idle"
  | "hashing"
  | "checking"
  | "uploading-file"
  | "uploading-meta"
  | "inscribing"
  | "indexing"
  | "done"
  | "error";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "",
  hashing: "Hashing file (SHA-256)…",
  checking: "Checking the registry for duplicates…",
  "uploading-file": "Pinning file to IPFS…",
  "uploading-meta": "Pinning metadata to IPFS…",
  inscribing: "Confirm the inscription in your wallet…",
  indexing: "Recording in the registry…",
  done: "Inscribed!",
  error: "Something went wrong",
};

const DEMO_LABELS: Record<Stage, string> = {
  ...STAGE_LABELS,
  "uploading-file": "Preparing local preview…",
  "uploading-meta": "Building metadata…",
  inscribing: "Simulating Bitcoin inscription…",
  indexing: "Saving to your demo registry…",
};

const STEP_ORDER: Stage[] = [
  "hashing",
  "uploading-file",
  "uploading-meta",
  "inscribing",
  "indexing",
  "done",
];

function labelFor(s: Stage): string {
  return (isDemo ? DEMO_LABELS : STAGE_LABELS)[s];
}

export default function InscribePage() {
  return (
    <div>
      <PageHeader
        title="Inscribe"
        subtitle={
          isDemo
            ? "Demo mode: hashing is real; the inscription is simulated. Upload a file to try the full flow — no wallet or funds needed."
            : `Upload a file to inscribe a permanent proof of authorship on ${networkLabel}.`
        }
      />
      <WalletGate>
        <InscribeForm />
      </WalletGate>
    </div>
  );
}

function InscribeForm() {
  const { ordinalsAddress, inscribe } = useWallet();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [feeRate, setFeeRate] = useState("");
  const [dragging, setDragging] = useState(false);

  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txid, setTxid] = useState<string | undefined>();
  const [result, setResult] = useState<InscriptionRecord | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const busy = stage !== "idle" && stage !== "done" && stage !== "error";

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
    if (!file || !title.trim() || !ordinalsAddress) return;
    setError(null);
    setResult(null);
    setTxid(undefined);

    try {
      // 1. Hash locally (real in both modes).
      setStage("hashing");
      const contentHash = await hashFile(file);

      // 2. Pre-check the registry so we fail fast on duplicates.
      setStage("checking");
      const { exists } = await verifyByHash(contentHash);
      if (exists) {
        throw new Error(
          "This exact file has already been inscribed. Each file can only be inscribed once."
        );
      }

      // 3 + 4. Store the file + metadata. Real mode pins to IPFS; demo mode keeps
      //        a local data-URL preview and uses synthetic ids.
      let cid: string;
      let metadataURI: string;
      let dataUrl: string | undefined;

      if (isDemo) {
        setStage("uploading-file");
        dataUrl = await fileToDataUrl(file);
        const short = contentHash.slice(2, 14);
        cid = `demo-${short}`;
        setStage("uploading-meta");
        metadataURI = `demo-meta-${short}`;
      } else {
        setStage("uploading-file");
        cid = (await pinFile(file)).cid;
        setStage("uploading-meta");
        const metaCid = (
          await pinJson({
            title: title.trim(),
            description: description.trim() || undefined,
            type: type.trim() || undefined,
            contentHash,
            fileName: file.name,
            mimeType: file.type || undefined,
          })
        ).cid;
        metadataURI = `ipfs://${metaCid}`;
      }

      // 5. Inscribe (simulated in demo; real wallet call otherwise).
      setStage("inscribing");
      const proof = JSON.stringify({
        p: "ip-inscription",
        v: 1,
        contentHash,
        cid,
        metadataURI,
        title: title.trim(),
      });
      const txId = await inscribe({
        content: proof,
        contentType: "application/json",
        payloadType: "PLAIN_TEXT",
        feeRate: feeRate ? Number(feeRate) : undefined,
      });
      setTxid(txId);

      // 6. Record it so Explore + Verify can find it.
      setStage("indexing");
      const record = await addRecord({
        contentHash,
        cid,
        metadataURI,
        owner: ordinalsAddress,
        txid: txId,
        inscriptionId: `${txId}i0`,
        network: networkLabel,
        title: title.trim(),
        description: description.trim() || undefined,
        type: type.trim() || undefined,
        fileName: file.name,
        mimeType: file.type || undefined,
        dataUrl,
        demo: isDemo,
      });

      setResult(record);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription failed.");
      setStage("error");
    }
  }

  function reset() {
    setFile(null);
    setTitle("");
    setDescription("");
    setType("");
    setFeeRate("");
    setStage("idle");
    setError(null);
    setTxid(undefined);
    setResult(null);
  }

  if (stage === "done" && result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-accent-400">
          {isDemo
            ? `✓ Simulated inscription recorded at ${formatTimestamp(result.timestamp)}. In real mode this would be a live Bitcoin transaction.`
            : `✓ Inscribed on ${networkType} at ${formatTimestamp(result.timestamp)}. The Bitcoin transaction may take a few minutes to confirm.`}
        </div>
        <Certificate rec={result} />
        <div className="flex flex-wrap gap-3">
          <Link href={`/inscription/${result.id}`} className="btn-ghost">
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
      {/* Upload */}
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
        {!isDemo && (
          <div>
            <label className="label" htmlFor="fee">
              Miner fee rate (sats/vB, optional)
            </label>
            <input
              id="fee"
              type="number"
              min="1"
              className="input"
              placeholder="leave blank to let the wallet choose"
              value={feeRate}
              onChange={(e) => setFeeRate(e.target.value)}
            />
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={!file || !title.trim() || busy}
        >
          {busy ? <Spinner /> : null}
          {busy ? labelFor(stage) : isDemo ? "Inscribe (demo)" : "Inscribe on Bitcoin"}
        </button>

        {busy && <ProgressSteps stage={stage} />}
        {txid && (
          <p className="text-xs text-ink-100/50">tx {shorten(txid, 10, 8)}</p>
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
              {labelFor(s)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
