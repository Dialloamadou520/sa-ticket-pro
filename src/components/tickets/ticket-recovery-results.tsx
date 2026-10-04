import { Phone } from "lucide-react";
import {
  TicketView,
  type TicketViewData,
} from "@/components/tickets/ticket-view";
import { formatDate } from "@/lib/format";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import type { Ticket, TicketStatus } from "@/lib/types";

const STATUS_BADGE: Record<TicketStatus, { label: string; className: string }> =
  {
    valid: { label: "Valide", className: "bg-emerald-100 text-emerald-700" },
    used: { label: "Déjà scanné", className: "bg-slate-100 text-slate-600" },
    cancelled: { label: "Annulé", className: "bg-red-100 text-red-700" },
    refunded: { label: "Remboursé", className: "bg-amber-100 text-amber-700" },
  };

/** Résultats de recherche d'un ticket perdu (admin et organisateur). */
export function TicketRecoveryResults({
  query,
  tickets,
}: {
  query: string;
  tickets: (Ticket & { phone?: string | null })[];
}) {
  if (!query) return null;
  return (
    <>
      <p className="text-sm text-slate-500">
        {tickets.length === 0
          ? `Aucun ticket trouvé pour « ${query} ».`
          : `${tickets.length} ticket${tickets.length > 1 ? "s" : ""} trouvé${
              tickets.length > 1 ? "s" : ""
            } pour « ${query} ».`}
      </p>

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
                  <span className="font-medium break-all text-slate-700">
                    {t.holder_email}
                  </span>
                )}
                {t.phone && (
                  <a
                    href={`tel:${t.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1 font-medium text-brand-700"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {t.phone}
                  </a>
                )}
                <span>Acheté le {formatDate(t.created_at)}</span>
              </div>
              <TicketView ticket={data} />
            </div>
          );
        })}
      </div>
    </>
  );
}
