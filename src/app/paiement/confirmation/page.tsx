import type { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { TicketView, type TicketViewData } from "@/components/tickets/ticket-view";
import { getEventBySlug } from "@/lib/data/events";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatDate } from "@/lib/format";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import type { Ticket } from "@/lib/types";

export const metadata: Metadata = { title: "Confirmation de paiement" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{
    demo?: string;
    event?: string;
    qty?: string;
    name?: string;
    ref?: string;
  }>;
}) {
  const sp = await searchParams;
  const tickets = await resolveTickets(sp);

  if (tickets === "pending") {
    return (
      <Container className="flex max-w-xl flex-col items-center py-20 text-center">
        <Clock className="h-14 w-14 text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Paiement en cours de traitement
        </h1>
        <p className="mt-2 text-slate-500">
          Votre paiement est en attente de confirmation. Vos tickets
          apparaîtront dans votre profil dès validation.
        </p>
        <LinkButton href="/profil?tab=tickets" className="mt-6">
          Voir mes tickets
        </LinkButton>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl py-12">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" />
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Paiement confirmé 🎉
        </h1>
        <p className="mt-2 text-slate-500">
          Merci ! Voici {tickets.length > 1 ? "vos tickets" : "votre ticket"}.
          {sp.demo && " (Aperçu de démonstration)"}
        </p>
      </div>

      <div className="mt-8 space-y-5">
        {tickets.map((t) => (
          <TicketView key={t.id} ticket={t} />
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <LinkButton href="/explorer" variant="outline">
          Découvrir d&apos;autres événements
        </LinkButton>
        <LinkButton href="/profil?tab=tickets">Mes tickets</LinkButton>
      </div>
    </Container>
  );
}

async function resolveTickets(sp: {
  demo?: string;
  event?: string;
  qty?: string;
  name?: string;
  ref?: string;
}): Promise<TicketViewData[] | "pending"> {
  // Mode démo
  if (sp.demo || !isSupabaseConfigured) {
    const event = sp.event ? await getEventBySlug(sp.event) : null;
    const qty = Math.max(1, Math.min(10, Number(sp.qty) || 1));
    const name = sp.name || "Invité";
    return Array.from({ length: qty }).map((_, i) => ({
      id: `demo-${Date.now()}-${i}`,
      eventTitle: event?.title ?? "Événement",
      date: event ? formatDate(event.starts_at) : "",
      location: event ? `${event.location}${event.city ? `, ${event.city}` : ""}` : "",
      holderName: name,
      ticketType: TICKET_TYPE_LABELS[event?.ticket_type ?? "standard"],
      qrToken: `demo${i}${Math.random().toString(36).slice(2, 10)}`,
    }));
  }

  // Mode réel
  if (!sp.ref) return "pending";
  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("status")
    .eq("id", sp.ref)
    .maybeSingle();

  if (!payment || payment.status !== "paid") return "pending";

  const { data } = await supabase
    .from("tickets")
    .select("*, event:events(*)")
    .eq("payment_id", sp.ref);

  const rows = (data as Ticket[]) ?? [];
  if (rows.length === 0) return "pending";

  return rows.map((t) => ({
    id: t.id,
    eventTitle: t.event?.title ?? "Événement",
    date: t.event ? formatDate(t.event.starts_at) : "",
    location: t.event
      ? `${t.event.location}${t.event.city ? `, ${t.event.city}` : ""}`
      : "",
    holderName: t.holder_name ?? "",
    ticketType: TICKET_TYPE_LABELS[t.ticket_type],
    qrToken: t.qr_token,
  }));
}
