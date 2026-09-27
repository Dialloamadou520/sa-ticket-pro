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

const STATUS_BADGE: Record<EventStatus, { label: string; className: string }> =
  {
    draft: { label: "Brouillon", className: "bg-slate-100 text-slate-600" },
    pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
    published: {
      label: "Publié",
      className: "bg-emerald-100 text-emerald-700",
    },
    rejected: { label: "Rejeté", className: "bg-red-100 text-red-700" },
    cancelled: { label: "Annulé", className: "bg-slate-100 text-slate-500" },
  };

type Filter = "all" | EventStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "published", label: "Publiés" },
  { key: "pending", label: "En attente" },
  { key: "draft", label: "Brouillons" },
  { key: "rejected", label: "Rejetés" },
  { key: "cancelled", label: "Annulés" },
];

function fillPercent(sold: number, capacity: number) {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((sold / capacity) * 100));
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
      <div className="space-y-3 border-b border-slate-100 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un événement, un organisateur…"
            aria-label="Rechercher un événement"
            className="h-11 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {label}
              <span
                className={
                  filter === key ? "text-white/80" : "text-slate-400"
                }
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
            const badge = STATUS_BADGE[event.status];
            const percent = fillPercent(event.ticketsSold, event.capacity);
            return (
              <li key={event.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-slate-900">
                    {event.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
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
                    className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-700"
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{event.organizerName}</span>
                  </Link>
                )}

                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-slate-500">Tickets vendus</span>
                      <span className="font-semibold text-slate-900">
                        {event.ticketsSold}/{event.capacity}{" "}
                        <span className="font-normal text-slate-500">
                          ({percent} %)
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <dt className="text-xs text-slate-500">Revenus</dt>
                      <dd className="truncate text-sm font-semibold text-slate-900">
                        {formatAmount(event.revenue)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-slate-500">Commission</dt>
                      <dd className="truncate text-sm font-medium text-slate-800">
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
