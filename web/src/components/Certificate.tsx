"use client";

import type { InscriptionRecord } from "@/lib/types";
import {
  ipfsToHttp,
  explorerAddressUrl,
  explorerTxUrl,
  ordinalsUrl,
} from "@/lib/config";
import { isDemo } from "@/lib/demo";
import { InfoRow, CopyButton, formatTimestamp } from "./ui";
import { IpfsPreview } from "./IpfsPreview";
import { shorten } from "@/lib/hash";

/**
 * Full Certificate of Inscription. Shows the record, a preview of the file, and
 * links to the Bitcoin transaction / ordinals explorer. In demo mode the txid and
 * storage are clearly marked as simulated/local rather than linked (the fake txid
 * would 404 on a real explorer).
 */
export function Certificate({
  rec,
  heading = "Certificate of Inscription",
}: {
  rec: InscriptionRecord;
  heading?: string;
}) {
  const demo = rec.demo ?? isDemo;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-700/60 bg-gradient-to-r from-brand-600/20 to-accent-500/10 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent-400">
              {heading}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {rec.title || `Inscription #${rec.id}`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {demo && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">
                simulated
              </span>
            )}
            <span className="pill">#{rec.id}</span>
          </div>
        </div>
        {rec.description && (
          <p className="mt-2 max-w-2xl text-sm text-ink-100/70">
            {rec.description}
          </p>
        )}
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-ink-100/40">
            Inscribed file
          </p>
          <IpfsPreview
            cid={rec.cid}
            dataUrl={rec.dataUrl}
            meta={{ mimeType: rec.mimeType, fileName: rec.fileName }}
          />
        </div>

        <div className="flex flex-col">
          {rec.type && <InfoRow label="Type">{rec.type}</InfoRow>}
          <InfoRow label="Network">
            {rec.network}
            {demo && <span className="text-ink-100/40"> (demo)</span>}
          </InfoRow>
          <InfoRow label="Content hash (SHA-256)">
            <span className="mono">{shorten(rec.contentHash, 12, 10)}</span>
            <CopyButton value={rec.contentHash} />
          </InfoRow>
          <InfoRow label="Owner">
            {demo ? (
              <span className="mono">{shorten(rec.owner, 8, 6)}</span>
            ) : (
              <a
                href={explorerAddressUrl(rec.owner)}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-brand-400 hover:underline"
              >
                {shorten(rec.owner, 8, 6)}
              </a>
            )}
            <CopyButton value={rec.owner} />
          </InfoRow>
          <InfoRow label="Inscribed">{formatTimestamp(rec.timestamp)}</InfoRow>

          {demo ? (
            <InfoRow label="Storage">Stored locally in your browser</InfoRow>
          ) : (
            <>
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
            </>
          )}

          <InfoRow label="Bitcoin tx">
            {demo ? (
              <span className="mono">
                {shorten(rec.txid, 8, 6)}
                <span className="text-ink-100/40"> (simulated)</span>
              </span>
            ) : (
              <a
                href={explorerTxUrl(rec.txid)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                {shorten(rec.txid, 8, 6)} ↗
              </a>
            )}
            <CopyButton value={rec.txid} />
          </InfoRow>

          {!demo && rec.inscriptionId && (
            <InfoRow label="Inscription">
              <a
                href={ordinalsUrl(rec.inscriptionId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                {shorten(rec.inscriptionId, 8, 6)} ↗
              </a>
            </InfoRow>
          )}
        </div>
      </div>
    </div>
  );
}
