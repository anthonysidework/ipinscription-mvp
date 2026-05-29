"use client";

import { useEffect, useState } from "react";
import { ipfsToHttp } from "@/lib/config";

type Meta = {
  mimeType?: string;
  fileName?: string;
};

/**
 * Best-effort inline preview of inscribed content. Renders images, audio, video,
 * a PDF, or a short text snippet; otherwise a download link.
 *
 * Source resolution:
 *   - `dataUrl` (demo mode): preview straight from the locally-stored data URL.
 *   - otherwise: the IPFS gateway URL for `cid`.
 * A `cid` beginning with "demo-" but without a data URL means a demo file that was
 * too large to keep locally, so we show a friendly note instead of a dead link.
 */
export function IpfsPreview({
  cid,
  meta,
  dataUrl,
}: {
  cid: string;
  meta?: Meta;
  dataUrl?: string;
}) {
  const isDataUrl = !!dataUrl;
  const isDemoStub = !dataUrl && cid.startsWith("demo-");
  const url = dataUrl || ipfsToHttp(cid);

  const initialMime =
    meta?.mimeType ||
    (dataUrl && dataUrl.startsWith("data:")
      ? dataUrl.slice(5, dataUrl.indexOf(";"))
      : undefined);

  const [mime, setMime] = useState<string | undefined>(initialMime);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (mime || isDataUrl || isDemoStub) return;
    fetch(url, { method: "HEAD" })
      .then((r) => {
        if (!cancelled) setMime(r.headers.get("content-type") ?? undefined);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url, mime, isDataUrl, isDemoStub]);

  useEffect(() => {
    let cancelled = false;
    if (isDemoStub) return;
    if (mime?.startsWith("text/") || mime === "application/json") {
      fetch(url)
        .then((r) => r.text())
        .then((t) => !cancelled && setText(t.slice(0, 2000)))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [url, mime, isDemoStub]);

  const frame = "overflow-hidden rounded-xl border border-ink-700 bg-ink-900";

  if (isDemoStub) {
    return (
      <div className={`${frame} px-4 py-8 text-center text-sm text-ink-100/50`}>
        Preview not stored (file too large for the local demo). In real mode the
        file is pinned to IPFS.
      </div>
    );
  }

  if (mime?.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={meta?.fileName ?? "inscribed file"} className={`${frame} max-h-96 w-full object-contain`} />;
  }
  if (mime?.startsWith("video/")) {
    return <video src={url} controls className={`${frame} max-h-96 w-full`} />;
  }
  if (mime?.startsWith("audio/")) {
    return <audio src={url} controls className="w-full" />;
  }
  if (mime === "application/pdf") {
    return <iframe src={url} className={`${frame} h-96 w-full`} title="PDF preview" />;
  }
  if (text !== null) {
    return (
      <pre className={`${frame} max-h-96 overflow-auto p-4 text-xs text-ink-100/80`}>
        {text}
      </pre>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
      {isDataUrl ? "Open file ↗" : "Open file on IPFS ↗"}
    </a>
  );
}
