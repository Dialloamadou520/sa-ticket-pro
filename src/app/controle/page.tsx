import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays, MapPin, ScanLine } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ScannerClient } from "@/components/tickets/scanner-client";
import { getCurrentUser } from "@/lib/data/auth";
import { getControllerEvents } from "@/lib/data/controllers";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = { title: "Contrôle des entrées" };

export default async function ControlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?redirect=/controle");

  const events = await getControllerEvents();

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
            Scannez les tickets des événements qui vous sont assignés.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
          Aucun événement ne vous est assigné pour le moment. Demandez à
          l&apos;organisateur de vous ajouter comme contrôleur avec cet email :
          <span className="mt-1 block font-medium text-slate-700">
            {user.email}
          </span>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vos événements assignés
            </p>
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <p className="font-medium text-slate-900">{event.title}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateShort(event.starts_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8">
            <ScannerClient />
          </div>
        </>
      )}
    </Container>
  );
}
