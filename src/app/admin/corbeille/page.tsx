import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Trash2 } from "lucide-react";
import { TrashEventActions } from "@/components/admin/trash-event-actions";
import { getDeletedEvents, isTrashAvailable } from "@/lib/data/event-trash";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = { title: "Corbeille" };

export default async function AdminTrashPage() {
  const [events, available] = await Promise.all([
    getDeletedEvents(),
    isTrashAvailable(),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;administration
      </Link>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 p-4 sm:items-center sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-slate-900">
              Corbeille · {events.length} événement(s)
            </h1>
            <p className="text-xs text-slate-500">
              Les événements supprimés sont conservés ici avec leurs tickets,
              ventes, contrôleurs et codes promo. « Restaurer » les remet en
              ligne à l&apos;identique.
            </p>
          </div>
        </div>

        {!available && (
          <p className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-800">
            Corbeille inactive : la migration{" "}
            <code>0018_event_trash.sql</code> n&apos;a pas encore été appliquée
            dans Supabase. Les suppressions faites d&apos;ici là ne sont pas
            récupérables.
          </p>
        )}

        {events.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun événement supprimé.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.map((event) => (
              <li
                key={event.id}
                className="space-y-3 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0 sm:p-5"
              >
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">
                    {event.title}
                  </h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {event.startsAt && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {formatDateShort(event.startsAt)}
                      </span>
                    )}
                    {event.organizerName && <span>{event.organizerName}</span>}
                    <span>
                      {event.ticketCount} ticket(s) · {event.paymentCount}{" "}
                      paiement(s)
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Supprimé le {formatDateShort(event.deletedAt)}
                  </p>
                </div>
                <TrashEventActions id={event.id} title={event.title} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
