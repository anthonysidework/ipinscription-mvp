"use client";

import Link from "next/link";
import type { InscriptionRecord } from "@/lib/types";
import { shorten } from "@/lib/hash";
import { formatTimestamp } from "./ui";

/** Compact list card for Explore / My Inscriptions grids. */
export function InscriptionCard({ rec }: { rec: InscriptionRecord }) {
  return (
    <Link
      href={`/inscription/${rec.id}`}
      className="card group flex flex-col gap-3 p-5 transition-colors hover:border-brand-500/60"
    >
      <div className="flex items-center justify-between">
        <span className="pill">#{rec.id}</span>
        <span className="text-xs text-ink-100/50">
          {formatTimestamp(rec.timestamp)}
        </span>
      </div>

      <div>
        <p className="truncate text-sm font-medium text-white">{rec.title}</p>
        {rec.type && <p className="mt-0.5 text-xs text-ink-100/50">{rec.type}</p>}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-ink-100/40">
          Content hash (SHA-256)
        </p>
        <p className="mono mt-1 text-ink-100/90">{shorten(rec.contentHash, 10, 8)}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-100/60">
        <span>owner {shorten(rec.owner, 6, 5)}</span>
        <span className="text-brand-400 group-hover:underline">view →</span>
      </div>
    </Link>
  );
}
