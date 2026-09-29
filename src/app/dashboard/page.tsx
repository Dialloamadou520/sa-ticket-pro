import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
  Ticket,
  Timer,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { EventStatusBadge } from "@/components/dashboard/event-status-badge";
import { getMyEvents, getOrganizerStats } from "@/lib/data/dashboard";
import {
  countdownLabel,
  displayFillPercent,
  formatDateShort,
  formatPrice,
} from "@/lib/format";
import type { Event } from "@/lib/types";

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
            {events.slice(0, 5).map((event) => (
              <li key={event.id}>
                <RecentEventRow event={event} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Action rapide d'une ligne : cible tactile confortable sur mobile. */
const QUICK_ACTION_CLASS =
  "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-white hover:text-slate-900";

function RecentEventRow({ event }: { event: Event }) {
  const capacity = event.capacity || 0;
  const sold = event.tickets_sold || 0;
  const pct = capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
  const fillPercent = displayFillPercent(event);
  const countdown = countdownLabel(event);
  const ongoing = countdown === "En cours";
  const finished = countdown === "Terminé";
  const barColor =
    pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-brand-500";

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex gap-3">
        <Link
          href={`/dashboard/evenements/${event.id}/modifier`}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-500/15 via-slate-100 to-slate-200"
        >
          {event.banner_url ? (
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-slate-400">
              <CalendarDays className="h-6 w-6" />
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/dashboard/evenements/${event.id}/modifier`}
              className="min-w-0 flex-1 line-clamp-2 font-semibold text-slate-900 hover:text-brand-700"
            >
              {event.title}
            </Link>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatDateShort(event.starts_at)}
            </span>
            {event.city && (
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{event.city}</span>
              </span>
            )}
          </p>
          {!finished && (
            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                ongoing
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Timer className="h-3 w-3" />
              {countdown}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            {sold.toLocaleString("fr-FR")}/{capacity.toLocaleString("fr-FR")}{" "}
            vendus
          </span>
          <span className="font-semibold text-slate-700">
            {formatPrice(sold * event.price)}
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${Math.max(pct, sold > 0 ? 3 : 0)}%` }}
          />
        </div>
        {fillPercent !== null && (
          <p className="mt-1.5 text-xs text-amber-600">
            Jauge affichée au public : {fillPercent} %
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/dashboard/evenements/${event.id}/participants`}
          className={QUICK_ACTION_CLASS}
        >
          <Users className="h-4 w-4 shrink-0" />
          Participants
        </Link>
        <Link
          href={`/dashboard/evenements/${event.id}/modifier`}
          className={QUICK_ACTION_CLASS}
        >
          <Pencil className="h-4 w-4 shrink-0" />
          Modifier
        </Link>
      </div>
    </div>
  );
}
