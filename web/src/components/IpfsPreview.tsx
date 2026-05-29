"use client";

import { useEffect, useState } from "react";
import { ipfsToHttp } from "@/lib/config";

type Meta = {
  mimeType?: string;
  fileName?: string;
};

/**
 * Best-effort inline preview of pinned content. Tries to render images, audio,
 * video, or a short text snippet; otherwise shows a download link. The mime type
 * is taken from the inscription metadata when available, else sniffed via HEAD.
 */
export function IpfsPreview({ cid, meta }: { cid: string; meta?: Meta }) {
  const url = ipfsToHttp(cid);
  const [mime, setMime] = useState<string | undefined>(meta?.mimeType);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (mime) return;
    fetch(url, { method: "HEAD" })
      .then((r) => {
        if (!cancelled) setMime(r.headers.get("content-type") ?? undefined);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url, mime]);

  useEffect(() => {
    let cancelled = false;
    if (mime?.startsWith("text/") || mime === "application/json") {
      fetch(url)
        .then((r) => r.text())
        .then((t) => !cancelled && setText(t.slice(0, 2000)))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [url, mime]);

  const frame =
    "overflow-hidden rounded-xl border border-ink-700 bg-ink-900";

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
      Open file on IPFS ↗
    </a>
  );
}
