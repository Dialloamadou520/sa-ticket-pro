import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  EventInvitations,
  type InvitationRow,
} from "@/components/dashboard/event-invitations";
import { getEventInvitations, getManageableEventById } from "@/lib/data/dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatDateShort, isEventPast } from "@/lib/format";
import type { TicketTier } from "@/lib/types";

export const metadata: Metadata = { title: "Invitations" };

async function getTiers(eventId: string): Promise<Pick<TicketTier, "id" | "name">[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await createAdminClient()
    .from("ticket_tiers")
    .select("id, name")
    .eq("event_id", eventId)
    .order("position");
  return (data as Pick<TicketTier, "id" | "name">[]) ?? [];
}

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manageable = await getManageableEventById(id);
  if (!manageable) notFound();
  const { event } = manageable;

  const [{ ready, invitations }, tiers] = await Promise.all([
    getEventInvitations(id),
    getTiers(id),
  ]);

  const rows: InvitationRow[] = invitations.map((t) => ({
    id: t.id,
    name: t.holder_name ?? "—",
    phone: t.phone,
    email: t.holder_email,
    ticketType: `Invitation · ${t.tier_name ?? TICKET_TYPE_LABELS[t.ticket_type]}`,
    status: t.status,
    qrToken: t.qr_token,
    date: formatDateShort(t.created_at),
  }));

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/dashboard/invitations" className="hover:text-brand-600">
          Invitations
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-slate-700">{event.title}</span>
      </nav>

      <div className="min-w-0">
        <h1 className="text-xl font-bold break-words text-slate-900 sm:text-2xl">
          {event.title}
        </h1>
        <p className="text-sm text-slate-500">
          {rows.length} invitation{rows.length > 1 ? "s" : ""} ·{" "}
          {rows.filter((r) => r.status === "used").length} entrée
          {rows.filter((r) => r.status === "used").length > 1 ? "s" : ""}
        </p>
      </div>

      <EventInvitations
        eventId={id}
        event={{
          title: event.title,
          date: formatDate(event.starts_at),
          location: `${event.location}${event.city ? `, ${event.city}` : ""}`,
        }}
        tiers={tiers}
        invitations={rows}
        ready={ready}
        closed={isEventPast(event)}
      />
    </div>
  );
}
