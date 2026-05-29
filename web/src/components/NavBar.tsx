"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { networkLabel } from "@/lib/config";
import { isDemo } from "@/lib/demo";

const links = [
  { href: "/inscribe", label: "Inscribe" },
  { href: "/me", label: "My Inscriptions" },
  { href: "/explore", label: "Explore" },
  { href: "/verify", label: "Verify" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            IP
          </span>
          <span className="hidden text-sm font-semibold tracking-wide text-white sm:block">
            IP&nbsp;Inscription
          </span>
          <span className="pill ml-1 hidden lg:inline-flex">
            {networkLabel}
            {isDemo ? " · demo" : ""}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-ink-800 text-white"
                    : "text-ink-100/70 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <ConnectButton />
      </div>
    </header>
  );
}
