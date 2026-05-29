"use client";

import Link from "next/link";
import type { IndexedInscription } from "@/lib/useRegistry";
import { shorten } from "@/lib/hash";
import { formatTimestamp } from "./ui";

/** Compact list card for Explore / My Inscriptions grids. */
export function InscriptionCard({ rec }: { rec: IndexedInscription }) {
  return (
    <Link
      href={`/inscription/${rec.id.toString()}`}
      className="card group flex flex-col gap-3 p-5 transition-colors hover:border-brand-500/60"
    >
      <div className="flex items-center justify-between">
        <span className="pill">#{rec.id.toString()}</span>
        <span className="text-xs text-ink-100/50">
          {formatTimestamp(rec.timestamp)}
        </span>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-ink-100/40">
          Content hash
        </p>
        <p className="mono mt-1 text-ink-100/90">{shorten(rec.contentHash, 10, 8)}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-100/60">
        <span>owner {shorten(rec.owner)}</span>
        <span className="text-brand-400 group-hover:underline">view →</span>
      </div>
    </Link>
  );
}
