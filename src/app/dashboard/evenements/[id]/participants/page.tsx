import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  DownloadParticipants,
  type ParticipantRow,
} from "@/components/dashboard/download-participants";
import { getEventParticipants, getMyEvents } from "@/lib/data/dashboard";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = { title: "Participants" };

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const events = await getMyEvents();
  const event = events.find((e) => e.id === id);
  if (!event) notFound();

  const tickets = await getEventParticipants(id);
  const rows: ParticipantRow[] = tickets.map((t) => ({
    name: t.holder_name ?? "—",
    type: TICKET_TYPE_LABELS[t.ticket_type],
    status: t.status,
    reference: t.id.slice(0, 8).toUpperCase(),
    date: formatDateShort(t.created_at),
  }));

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/dashboard/evenements" className="hover:text-brand-600">
          Mes événements
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-700">Participants</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
          <p className="text-sm text-slate-500">
            {tickets.length} participant{tickets.length > 1 ? "s" : ""} ·{" "}
            {event.tickets_sold} tickets vendus
          </p>
        </div>
        <DownloadParticipants
          rows={rows}
          filename={`participants-${event.slug}.csv`}
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">
          Aucun participant enregistré pour le moment.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Référence</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.reference}>
                  <td className="px-5 py-3 font-medium text-slate-900">{r.name}</td>
                  <td className="px-5 py-3 text-slate-500">{r.type}</td>
                  <td className="px-5 py-3 text-slate-500">{r.status}</td>
                  <td className="px-5 py-3 text-slate-500">{r.reference}</td>
                  <td className="px-5 py-3 text-slate-500">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
