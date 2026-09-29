import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ScannerClient } from "@/components/tickets/scanner-client";

export const metadata: Metadata = { title: "Scanner les tickets" };

export default function ScannerPage() {
  return (
    <Container className="max-w-xl py-6 sm:py-10">
      <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-lg sm:p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
          <ScanLine className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Contrôle des entrées</h1>
          <p className="text-sm text-slate-300">
            Scannez le QR code des tickets — un ticket n&apos;est utilisable
            qu&apos;une seule fois.
          </p>
        </div>
      </div>
      <div className="mt-4 sm:mt-6">
        <ScannerClient />
      </div>
    </Container>
  );
}
