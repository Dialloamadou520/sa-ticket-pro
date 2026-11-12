import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  PhysicalTickets,
  type PhysicalBatchRow,
  type PhysicalCategoryOption,
} from "@/components/dashboard/physical-tickets";
import { getManageableEventById, getPhysicalBatches } from "@/lib/data/dashboard";
import { getTicketDesigns } from "@/lib/data/ticket-designs";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatDateShort, formatPrice, isEventPast } from "@/lib/format";
import { getTierTheme } from "@/lib/tier-theme";
import type { TicketTier } from "@/lib/types";

export const metadata: Metadata = { title: "Billets physiques" };

type TierRow = Pick<TicketTier, "id" | "name" | "price">;

async function getTiers(eventId: string): Promise<TierRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await createAdminClient()
    .from("ticket_tiers")
    .select("id, name, price")
    .eq("event_id", eventId)
    .order("position");
  return (data as TierRow[]) ?? [];
}

export default async function PhysicalTicketsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manageable = await getManageableEventById(id);
  if (!manageable) notFound();
  const { event } = manageable;

  const [{ ready, batches }, tiers, designs] = await Promise.all([
    getPhysicalBatches(id),
    getTiers(id),
    getTicketDesigns([id]),
  ]);

  const defaultCategory = TICKET_TYPE_LABELS[event.ticket_type];
  const rows: PhysicalBatchRow[] = batches.map((b) => {
    const tier = tiers.find((t) => t.id === b.tier_id);
    const category = b.tier_name ?? defaultCategory;
    return {
      id: b.id,
      label: b.label,
      category,
      price: formatPrice(b.price ?? (tier ? tier.price : event.price)),
      color: getTierTheme(category).pdf,
      quantity: b.quantity,
      firstNumber: b.first_number,
      lastNumber: b.lastNumber,
      scanned: b.scanned,
      cancelled: b.cancelled,
      date: formatDateShort(b.created_at),
    };
  });

  // Catégories proposées : celles vendues en ligne, puis celles créées pour
  // des lots papier précédents (dernier prix utilisé), sinon la catégorie
  // unique de l'événement.
  const categories: PhysicalCategoryOption[] = tiers.map((t) => ({
    value: `tier:${t.id}`,
    label: `${t.name} — ${formatPrice(t.price)}`,
  }));
  if (tiers.length === 0) {
    categories.push({ value: "default", label: `${defaultCategory} — ${formatPrice(event.price)}` });
  }
  const seen = new Set<string>();
  for (const b of batches) {
    if (b.tier_id || !b.tier_name || seen.has(b.tier_name)) continue;
    seen.add(b.tier_name);
    categories.push({
      value: `phys:${b.id}`,
      label: `${b.tier_name} — ${formatPrice(b.price ?? 0)} (papier)`,
    });
  }

  const total = rows.reduce((s, r) => s + r.quantity - r.cancelled, 0);
  const scanned = rows.reduce((s, r) => s + r.scanned, 0);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/dashboard/billets-physiques" className="hover:text-brand-600">
          Billets physiques
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-slate-700">{event.title}</span>
      </nav>

      <div className="min-w-0">
        <h1 className="text-xl font-bold break-words text-slate-900 sm:text-2xl">
          {event.title}
        </h1>
        <p className="text-sm text-slate-500">
          {total.toLocaleString("fr-FR")} billet{total > 1 ? "s" : ""} papier ·{" "}
          {scanned.toLocaleString("fr-FR")} entrée{scanned > 1 ? "s" : ""}
        </p>
      </div>

      <PhysicalTickets
        eventId={id}
        eventSlug={event.slug}
        event={{
          title: event.title,
          date: formatDate(event.starts_at),
          location: `${event.location}${event.city ? `, ${event.city}` : ""}`,
        }}
        categories={categories}
        batches={rows}
        designs={designs[id] ?? {}}
        ready={ready}
        closed={isEventPast(event)}
      />
    </div>
  );
}
