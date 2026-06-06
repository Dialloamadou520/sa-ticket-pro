import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Users } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/dashboard/event-status-badge";
import { DeleteEventButton } from "@/components/dashboard/delete-event-button";
import { getMyEvents } from "@/lib/data/dashboard";
import { formatDateShort, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Mes événements" };

export default async function MesEvenementsPage() {
  const events = await getMyEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mes événements</h1>
        <LinkButton href="/dashboard/evenements/nouveau" size="sm">
          <Plus className="h-4 w-4" />
          Nouveau
        </LinkButton>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <p className="font-medium text-slate-700">Aucun événement</p>
          <p className="mt-1 text-sm text-slate-500">
            Créez votre premier événement pour commencer à vendre des tickets.
          </p>
          <LinkButton href="/dashboard/evenements/nouveau" className="mt-5">
            Créer un événement
          </LinkButton>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Événement</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Prix</th>
                <th className="px-5 py-3">Vendus</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {event.title}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {formatDateShort(event.starts_at)}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {formatPrice(event.price)}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {event.tickets_sold}/{event.capacity}
                  </td>
                  <td className="px-5 py-3">
                    <EventStatusBadge status={event.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/evenements/${event.id}/participants`}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                      >
                        <Users className="h-4 w-4" />
                        Participants
                      </Link>
                      <Link
                        href={`/dashboard/evenements/${event.id}/modifier`}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </Link>
                      <DeleteEventButton id={event.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
