import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search, TicketCheck } from "lucide-react";
import { TicketView, type TicketViewData } from "@/components/tickets/ticket-view";
import { searchTickets } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import type { TicketStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Récupérer un ticket" };

const STATUS_BADGE: Record<TicketStatus, { label: string; className: string }> = {
  valid: { label: "Valide", className: "bg-emerald-100 text-emerald-700" },
  used: { label: "Déjà scanné", className: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Annulé", className: "bg-red-100 text-red-700" },
  refunded: { label: "Remboursé", className: "bg-amber-100 text-amber-700" },
};

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const tickets = query ? await searchTickets(query) : [];

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
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <TicketCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-semibold text-slate-900">
              Récupérer un ticket perdu
            </h1>
            <p className="text-xs text-slate-500">
              Retrouvez le billet d&apos;un participant par son nom, son email ou
              la référence du ticket, puis renvoyez-lui le QR code ou le PDF.
            </p>
          </div>
        </div>

        <form action="/admin/tickets" className="flex gap-2 p-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Nom, email ou référence (ex. A1B2C3D4)"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Rechercher
          </button>
        </form>
      </section>

      {query && (
        <p className="text-sm text-slate-500">
          {tickets.length === 0
            ? `Aucun ticket trouvé pour « ${query} ».`
            : `${tickets.length} ticket${tickets.length > 1 ? "s" : ""} trouvé${
                tickets.length > 1 ? "s" : ""
              } pour « ${query} ».`}
        </p>
      )}

      <div className="space-y-5">
        {tickets.map((t) => {
          const badge = STATUS_BADGE[t.status];
          const data: TicketViewData = {
            id: t.id,
            eventTitle: t.event?.title ?? "Événement",
            date: t.event ? formatDate(t.event.starts_at) : "",
            location: t.event
              ? `${t.event.location}${t.event.city ? `, ${t.event.city}` : ""}`
              : "",
            holderName: t.holder_name ?? "",
            ticketType: t.tier_name ?? TICKET_TYPE_LABELS[t.ticket_type],
            qrToken: t.qr_token,
          };
          return (
            <div key={t.id}>
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${badge.className}`}
                >
                  {badge.label}
                </span>
                {t.holder_email && (
                  <span className="font-medium text-slate-700">
                    {t.holder_email}
                  </span>
                )}
                <span>Acheté le {formatDate(t.created_at)}</span>
              </div>
              <TicketView ticket={data} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
