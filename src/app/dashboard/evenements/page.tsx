import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Timer,
  Users,
  UserCog,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/dashboard/event-status-badge";
import { DeleteEventButton } from "@/components/dashboard/delete-event-button";
import { getManageableEvents } from "@/lib/data/dashboard";
import {
  countdownLabel,
  displayFillPercent,
  formatDateShort,
  formatPrice,
} from "@/lib/format";
import type { Event } from "@/lib/types";

export const metadata: Metadata = { title: "Mes événements" };

export default async function MesEvenementsPage() {
  const { owned, collaborated } = await getManageableEvents();
  const rows: Array<{ event: Event; isOwner: boolean }> = [
    ...owned.map((event) => ({ event, isOwner: true })),
    ...collaborated.map((event) => ({ event, isOwner: false })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes événements</h1>
          {rows.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {rows.length} événement{rows.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <LinkButton href="/dashboard/evenements/nouveau" size="sm">
          <Plus className="h-4 w-4" />
          Nouveau
        </LinkButton>
      </div>

      {rows.length === 0 ? (
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ event, isOwner }) => (
            <EventCard key={event.id} event={event} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isOwner }: { event: Event; isOwner: boolean }) {
  const capacity = event.capacity || 0;
  const sold = event.tickets_sold || 0;
  const pct = capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
  const fillPercent = displayFillPercent(event);
  const countdown = countdownLabel(event);
  const upcoming = countdown !== "Terminé";
  const ongoing = countdown === "En cours";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-500/15 via-slate-100 to-slate-200">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <CalendarDays className="h-10 w-10" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <EventStatusBadge status={event.status} />
          {upcoming && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white backdrop-blur ${
                ongoing ? "bg-emerald-600/90" : "bg-slate-900/80"
              }`}
            >
              <Timer className="h-3.5 w-3.5" />
              {countdown}
            </span>
          )}
        </div>
        {!isOwner && (
          <span className="absolute bottom-3 left-3 rounded-full bg-violet-600/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            Co-organisation
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900">
          {event.title}
        </h3>
        <div className="mt-3 space-y-1.5 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {formatDateShort(event.starts_at)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">
              {event.location}
              {event.city ? `, ${event.city}` : ""}
            </span>
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              {sold.toLocaleString("fr-FR")}/{capacity.toLocaleString("fr-FR")}{" "}
              vendus
            </span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {fillPercent !== null && (
            <p className="mt-1.5 text-xs text-amber-600">
              Jauge affichée au public : {fillPercent} % (vos chiffres réels
              restent privés)
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <span className="font-bold text-brand-700">
            {formatPrice(event.price)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
        <Link
          href={`/dashboard/evenements/${event.id}/participants`}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-white hover:text-slate-900"
        >
          <Users className="h-4 w-4" />
          Participants
        </Link>
        <Link
          href={`/dashboard/evenements/${event.id}/controleurs`}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-white hover:text-slate-900"
        >
          <ShieldCheck className="h-4 w-4" />
          Contrôleurs
        </Link>
        {isOwner && (
          <Link
            href={`/dashboard/evenements/${event.id}/co-organisateurs`}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-white hover:text-slate-900"
          >
            <UserCog className="h-4 w-4" />
            Co-organisateurs
          </Link>
        )}
        <Link
          href={`/dashboard/evenements/${event.id}/modifier`}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-white hover:text-slate-900"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </Link>
        {isOwner && (
          <div className="ml-auto">
            <DeleteEventButton id={event.id} />
          </div>
        )}
      </div>
    </div>
  );
}
