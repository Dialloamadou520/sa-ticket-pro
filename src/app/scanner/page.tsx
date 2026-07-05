import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ScannerClient } from "@/components/tickets/scanner-client";

export const metadata: Metadata = { title: "Scanner les tickets" };

export default function ScannerPage() {
  return (
    <Container className="max-w-xl py-6 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm sm:h-11 sm:w-11">
          <ScanLine className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Contrôle des entrées
          </h1>
          <p className="text-sm text-slate-500">
            Scannez le QR code des tickets pour valider l&apos;accès — un ticket
            n&apos;est utilisable qu&apos;une seule fois.
          </p>
        </div>
      </div>
      <div className="mt-6 sm:mt-8">
        <ScannerClient />
      </div>
    </Container>
  );
}
