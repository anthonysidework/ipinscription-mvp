import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/NavBar";
import { DemoBanner } from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "IP Inscription",
  description:
    "Inscribe your IP onto Bitcoin — a verifiable, timestamped, tamper-proof proof of authorship.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <DemoBanner />
          <NavBar />
          <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
