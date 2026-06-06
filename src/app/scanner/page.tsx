import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ScannerClient } from "@/components/tickets/scanner-client";

export const metadata: Metadata = { title: "Scanner les tickets" };

export default function ScannerPage() {
  return (
    <Container className="max-w-xl py-10">
      <h1 className="text-2xl font-bold text-slate-900">Contrôle des entrées</h1>
      <p className="mt-2 text-sm text-slate-500">
        Scannez le QR code des tickets à l&apos;entrée de votre événement pour
        valider l&apos;accès. Chaque ticket ne peut être utilisé qu&apos;une fois.
      </p>
      <div className="mt-8">
        <ScannerClient />
      </div>
    </Container>
  );
}
