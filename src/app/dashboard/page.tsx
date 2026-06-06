import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Ticket, TrendingUp, Wallet } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { EventStatusBadge } from "@/components/dashboard/event-status-badge";
import { getMyEvents, getOrganizerStats } from "@/lib/data/dashboard";
import { formatDateShort, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const [stats, events] = await Promise.all([
    getOrganizerStats(),
    getMyEvents(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vue d&apos;ensemble</h1>
          <p className="text-sm text-slate-500">
            Suivez les performances de vos événements.
          </p>
        </div>
        <LinkButton href="/dashboard/evenements/nouveau">
          Créer un événement
        </LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Événements" value={String(stats.totalEvents)} icon={CalendarDays} />
        <StatCard label="Publiés" value={String(stats.publishedEvents)} icon={TrendingUp} />
        <StatCard
          label="Tickets vendus"
          value={stats.totalTicketsSold.toLocaleString("fr-FR")}
          icon={Ticket}
        />
        <StatCard
          label="Revenus"
          value={formatPrice(stats.totalRevenue)}
          icon={Wallet}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Événements récents</h2>
          <Link href="/dashboard/evenements" className="text-sm text-brand-600 hover:underline">
            Tout voir
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun événement pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.slice(0, 5).map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/evenements/${event.id}/modifier`}
                    className="truncate font-medium text-slate-900 hover:text-brand-600"
                  >
                    {event.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {formatDateShort(event.starts_at)} · {event.tickets_sold}/
                    {event.capacity} vendus
                  </p>
                </div>
                <EventStatusBadge status={event.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
