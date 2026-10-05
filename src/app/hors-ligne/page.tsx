import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Hors connexion",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <Container className="flex flex-col items-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-slate-900">Pas de connexion</h1>
      <p className="mt-2 max-w-sm text-slate-500">
        Vérifiez votre réseau internet puis réessayez.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
      >
        Réessayer
      </Link>
    </Container>
  );
}
