"use client";

import { useEffect, useState } from "react";
import type { IndexedInscription } from "@/lib/useRegistry";
import { ipfsToHttp, explorerAddressUrl, explorerTxUrl } from "@/lib/config";
import { InfoRow, CopyButton, formatTimestamp } from "./ui";
import { IpfsPreview } from "./IpfsPreview";
import { shorten } from "@/lib/hash";

type MetaJson = {
  title?: string;
  description?: string;
  type?: string;
  fileName?: string;
  mimeType?: string;
  contentHash?: string;
};

/**
 * Full Certificate of Inscription. Shows the on-chain record plus the metadata
 * fetched from IPFS and a preview of the inscribed file. Optionally renders a
 * transaction link when known (e.g. right after inscribing).
 */
export function Certificate({
  rec,
  txHash,
  heading = "Certificate of Inscription",
}: {
  rec: IndexedInscription;
  txHash?: string;
  heading?: string;
}) {
  const [meta, setMeta] = useState<MetaJson | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!rec.metadataURI) return;
    fetch(ipfsToHttp(rec.metadataURI))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => !cancelled && setMeta(j))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [rec.metadataURI]);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-700/60 bg-gradient-to-r from-brand-600/20 to-accent-500/10 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent-400">
              {heading}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {meta?.title || `Inscription #${rec.id.toString()}`}
            </h2>
          </div>
          <span className="pill">#{rec.id.toString()}</span>
        </div>
        {meta?.description && (
          <p className="mt-2 max-w-2xl text-sm text-ink-100/70">
            {meta.description}
          </p>
        )}
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-ink-100/40">
            Inscribed file
          </p>
          <IpfsPreview cid={rec.cid} meta={meta ?? undefined} />
        </div>

        <div className="flex flex-col">
          {meta?.type && <InfoRow label="Type">{meta.type}</InfoRow>}
          <InfoRow label="Content hash">
            <span className="mono">{shorten(rec.contentHash, 12, 10)}</span>
            <CopyButton value={rec.contentHash} />
          </InfoRow>
          <InfoRow label="Owner">
            <a
              href={explorerAddressUrl(rec.owner)}
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-brand-400 hover:underline"
            >
              {shorten(rec.owner, 8, 6)}
            </a>
            <CopyButton value={rec.owner} />
          </InfoRow>
          <InfoRow label="Timestamp">
            {formatTimestamp(rec.timestamp)}
          </InfoRow>
          <InfoRow label="File (IPFS)">
            <a
              href={ipfsToHttp(rec.cid)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:underline"
            >
              {shorten(rec.cid, 8, 6)} ↗
            </a>
            <CopyButton value={rec.cid} />
          </InfoRow>
          <InfoRow label="Metadata (IPFS)">
            <a
              href={ipfsToHttp(rec.metadataURI)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:underline"
            >
              open ↗
            </a>
          </InfoRow>
          {txHash && (
            <InfoRow label="Transaction">
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                {shorten(txHash, 8, 6)} ↗
              </a>
            </InfoRow>
          )}
        </div>
      </div>
    </div>
  );
}
