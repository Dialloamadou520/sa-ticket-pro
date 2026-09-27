"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, CalendarDays, MapPin, Search } from "lucide-react";
import { AdminDeleteEventButton } from "@/components/admin/delete-event-button";
import { AdminPublishEventButton } from "@/components/admin/publish-event-button";
import { EventCommissionEditor } from "@/components/admin/event-commission-editor";
import { formatAmount, formatDateShort } from "@/lib/format";
import type { EventStatus } from "@/lib/types";

export interface AdminEventCard {
  id: string;
  title: string;
  place: string;
  startsAt: string;
  status: EventStatus;
  ticketsSold: number;
  capacity: number;
  revenue: number;
  commission: number;
  commissionRate: number;
  organizerId: string | null;
  organizerName: string | null;
}

const STATUS_STYLE: Record<
  EventStatus,
  { label: string; badge: string; accent: string; chip: string }
> = {
  draft: {
    label: "Brouillon",
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    accent: "before:bg-slate-300",
    chip: "bg-slate-600 text-white",
  },
  pending: {
    label: "En attente",
    badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    accent: "before:bg-amber-400",
    chip: "bg-amber-500 text-white",
  },
  published: {
    label: "Publié",
    badge: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    accent: "before:bg-emerald-500",
    chip: "bg-emerald-600 text-white",
  },
  rejected: {
    label: "Rejeté",
    badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    accent: "before:bg-rose-400",
    chip: "bg-rose-600 text-white",
  },
  cancelled: {
    label: "Annulé",
    badge: "bg-slate-200 text-slate-600 ring-1 ring-slate-300",
    accent: "before:bg-slate-400",
    chip: "bg-slate-500 text-white",
  },
};

type Filter = "all" | EventStatus;

const FILTERS: { key: Filter; label: string; chip: string }[] = [
  { key: "all", label: "Tous", chip: "bg-brand-600 text-white" },
  { key: "published", label: "Publiés", chip: STATUS_STYLE.published.chip },
  { key: "pending", label: "En attente", chip: STATUS_STYLE.pending.chip },
  { key: "draft", label: "Brouillons", chip: STATUS_STYLE.draft.chip },
  { key: "rejected", label: "Rejetés", chip: STATUS_STYLE.rejected.chip },
  { key: "cancelled", label: "Annulés", chip: STATUS_STYLE.cancelled.chip },
];

function fillPercent(sold: number, capacity: number) {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((sold / capacity) * 100));
}

/** Bleu → vert → orange → rouge à mesure que l'événement se remplit. */
function fillStyle(percent: number) {
  if (percent >= 90)
    return {
      bar: "bg-gradient-to-r from-rose-400 to-rose-600",
      text: "text-rose-600",
    };
  if (percent >= 70)
    return {
      bar: "bg-gradient-to-r from-amber-400 to-orange-500",
      text: "text-orange-600",
    };
  if (percent > 0)
    return {
      bar: "bg-gradient-to-r from-brand-400 to-brand-600",
      text: "text-brand-700",
    };
  return { bar: "bg-slate-300", text: "text-slate-500" };
}

/** Liste des événements de l'admin en cartes, optimisée pour le téléphone. */
export function AdminEventsMobile({ events }: { events: AdminEventCard[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: events.length,
      draft: 0,
      pending: 0,
      published: 0,
      rejected: 0,
      cancelled: 0,
    };
    for (const event of events) base[event.status] += 1;
    return base;
  }, [events]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return events.filter((event) => {
      if (filter !== "all" && event.status !== filter) return false;
      if (!needle) return true;
      return (
        event.title.toLowerCase().includes(needle) ||
        event.place.toLowerCase().includes(needle) ||
        (event.organizerName ?? "").toLowerCase().includes(needle)
      );
    });
  }, [events, filter, query]);

  return (
    <div className="sm:hidden">
      <div className="space-y-3 border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un événement, un organisateur…"
            aria-label="Rechercher un événement"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map(({ key, label, chip }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                filter === key
                  ? `${chip} shadow-sm`
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  filter === key
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Aucun événement ne correspond à cette recherche.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((event) => {
            const style = STATUS_STYLE[event.status];
            const percent = fillPercent(event.ticketsSold, event.capacity);
            const fill = fillStyle(percent);
            return (
              <li
                key={event.id}
                className={`relative space-y-3 p-4 pl-5 before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full ${style.accent}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-slate-900">
                    {event.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}
                  >
                    {style.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {formatDateShort(event.startsAt)}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{event.place}</span>
                  </span>
                </div>

                {event.organizerId && event.organizerName && (
                  <Link
                    href={`/admin/organisateurs/${event.organizerId}`}
                    className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-brand-50 px-3 text-xs font-medium text-brand-700 ring-1 ring-brand-100"
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                    <span className="truncate">{event.organizerName}</span>
                  </Link>
                )}

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-slate-500">Tickets vendus</span>
                      <span className="font-semibold text-slate-900">
                        {event.ticketsSold}/{event.capacity}{" "}
                        <span className={`font-semibold ${fill.text}`}>
                          ({percent} %)
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${fill.bar}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-2">
                    <div className="min-w-0 rounded-lg bg-brand-50 p-2 ring-1 ring-brand-100">
                      <dt className="text-xs font-medium text-brand-700">
                        Revenus
                      </dt>
                      <dd className="truncate text-sm font-bold text-brand-800">
                        {formatAmount(event.revenue)}
                      </dd>
                    </div>
                    <div className="min-w-0 rounded-lg bg-indigo-50 p-2 ring-1 ring-indigo-100">
                      <dt className="text-xs font-medium text-indigo-700">
                        Commission
                      </dt>
                      <dd className="truncate text-sm font-bold text-indigo-800">
                        {formatAmount(event.commission)}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
                    <span className="text-xs text-slate-500">
                      Taux de commission
                    </span>
                    <EventCommissionEditor
                      id={event.id}
                      rate={event.commissionRate}
                    />
                  </div>
                </div>

                <div
                  className={`grid gap-2 [&_button]:w-full ${
                    event.status === "published" ? "" : "grid-cols-2"
                  }`}
                >
                  {event.status !== "published" && (
                    <AdminPublishEventButton
                      id={event.id}
                      title={event.title}
                    />
                  )}
                  <AdminDeleteEventButton id={event.id} title={event.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
