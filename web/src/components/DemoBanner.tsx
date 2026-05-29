import { isDemo } from "@/lib/demo";

/**
 * Thin top banner shown in demo mode so testers know inscriptions are simulated.
 * Server-safe (no hooks); renders nothing in real mode.
 */
export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200">
      <span className="font-medium">Demo mode</span> — hashing is real; wallet &
      Bitcoin inscription are simulated and saved in your browser. No wallet, funds,
      or keys needed.
    </div>
  );
}
