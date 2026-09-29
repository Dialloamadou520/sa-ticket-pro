import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Plus,
  Ticket,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
    <div className="space-y-5 sm:space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-lg sm:p-6">
        <p className="text-sm text-white/70">Revenus encaissés</p>
        <p className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">
          {formatPrice(stats.totalRevenue)}
        </p>
        <p className="mt-2 text-sm text-white/80">
          {stats.totalTicketsSold.toLocaleString("fr-FR")} ticket
          {stats.totalTicketsSold > 1 ? "s" : ""} vendu
          {stats.totalTicketsSold > 1 ? "s" : ""} ·{" "}
          {stats.publishedEvents} événement
          {stats.publishedEvents > 1 ? "s" : ""} publié
          {stats.publishedEvents > 1 ? "s" : ""}
        </p>
        <LinkButton
          href="/dashboard/evenements/nouveau"
          variant="secondary"
          className="mt-4 w-full justify-center sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Créer un événement
        </LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Événements"
          value={String(stats.totalEvents)}
          icon={CalendarDays}
        />
        <StatCard
          label="Publiés"
          value={String(stats.publishedEvents)}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Tickets vendus"
          value={stats.totalTicketsSold.toLocaleString("fr-FR")}
          icon={Ticket}
          tone="indigo"
        />
        <StatCard
          label="Revenus"
          value={formatPrice(stats.totalRevenue)}
          icon={Wallet}
          tone="amber"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <h2 className="font-semibold text-slate-900">Événements récents</h2>
          <Link
            href="/dashboard/evenements"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Tout voir
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-slate-500">
              Aucun événement pour le moment.
            </p>
            <LinkButton
              href="/dashboard/evenements/nouveau"
              className="mt-4 w-full justify-center sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Créer mon premier événement
            </LinkButton>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.slice(0, 5).map((event) => {
              const pct =
                event.capacity > 0
                  ? Math.min(
                      100,
                      Math.round((event.tickets_sold / event.capacity) * 100)
                    )
                  : 0;
              return (
                <li key={event.id}>
                  <Link
                    href={`/dashboard/evenements/${event.id}/modifier`}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate font-semibold text-slate-900">
                          {event.title}
                        </p>
                        <EventStatusBadge status={event.status} />
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {formatDateShort(event.starts_at)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-medium text-slate-600">
                          {event.tickets_sold}/{event.capacity}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
