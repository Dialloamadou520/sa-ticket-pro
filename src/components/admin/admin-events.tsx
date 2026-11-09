"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  Printer,
  Search,
  Smartphone,
} from "lucide-react";
import { AdminDeleteEventButton } from "@/components/admin/delete-event-button";
import { AdminPublishEventButton } from "@/components/admin/publish-event-button";
import { EventCommissionEditor } from "@/components/admin/event-commission-editor";
import { formatAmount, formatDateShort, formatPrice } from "@/lib/format";
import type { EventStatus } from "@/lib/types";

export interface AdminEventCard {
  id: string;
  slug: string;
  title: string;
  bannerUrl: string | null;
  place: string;
  price: number;
  startsAt: string;
  status: EventStatus;
  ticketsSold: number;
  capacity: number;
  physicalTickets: number;
  physicalEntered: number;
  revenue: number;
  commission: number;
  commissionRate: number;
  organizerId: string | null;
  organizerName: string | null;
}

const STATUS_STYLE: Record<
  EventStatus,
  { label: string; badge: string; chip: string }
> = {
  draft: {
    label: "Brouillon",
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    chip: "bg-slate-600 text-white",
  },
  pending: {
    label: "En attente",
    badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    chip: "bg-amber-500 text-white",
  },
  published: {
    label: "Publié",
    badge: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    chip: "bg-emerald-600 text-white",
  },
  rejected: {
    label: "Rejeté",
    badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    chip: "bg-rose-600 text-white",
  },
  cancelled: {
    label: "Annulé",
    badge: "bg-slate-200 text-slate-600 ring-1 ring-slate-300",
    chip: "bg-slate-500 text-white",
  },
};

type Filter = "all" | EventStatus;
type When = "all" | "upcoming" | "past";
type SortKey = "recent" | "date" | "revenue" | "sales";

const FILTERS: { key: Filter; label: string; chip: string }[] = [
  { key: "all", label: "Tous", chip: "bg-slate-900 text-white" },
  { key: "published", label: "Publiés", chip: STATUS_STYLE.published.chip },
  { key: "pending", label: "En attente", chip: STATUS_STYLE.pending.chip },
  { key: "draft", label: "Brouillons", chip: STATUS_STYLE.draft.chip },
  { key: "rejected", label: "Rejetés", chip: STATUS_STYLE.rejected.chip },
  { key: "cancelled", label: "Annulés", chip: STATUS_STYLE.cancelled.chip },
];

const WHEN: { key: When; label: string }[] = [
  { key: "all", label: "Toutes dates" },
  { key: "upcoming", label: "À venir" },
  { key: "past", label: "Passés" },
];

function fillPercent(sold: number, capacity: number) {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((sold / capacity) * 100));
}

function fillStyle(percent: number) {
  if (percent >= 90) return { bar: "bg-rose-500", text: "text-rose-600" };
  if (percent >= 70) return { bar: "bg-orange-500", text: "text-orange-600" };
  if (percent > 0) return { bar: "bg-brand-500", text: "text-brand-700" };
  return { bar: "bg-slate-300", text: "text-slate-500" };
}

function isPast(startsAt: string, now: number) {
  return new Date(startsAt).getTime() < now;
}

function EventCard({ event, now }: { event: AdminEventCard; now: number }) {
  const style = STATUS_STYLE[event.status];
  const percent = fillPercent(event.ticketsSold, event.capacity);
  const fill = fillStyle(percent);
  const past = isPast(event.startsAt, now);
  const published = event.status === "published";

  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex gap-3 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 sm:h-24 sm:w-24">
          {event.bannerUrl ? (
            <Image
              src={event.bannerUrl}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-2xl font-bold text-white/90">
              {event.title.trim()[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}
            >
              {style.label}
            </span>
            {past && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                Terminé
              </span>
            )}
          </div>
          <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-900">
            {published ? (
              <Link
                href={`/evenements/${event.slug}`}
                target="_blank"
                className="hover:text-brand-700"
              >
                {event.title}
                <ExternalLink className="ml-1 inline h-3.5 w-3.5 text-slate-400" />
              </Link>
            ) : (
              event.title
            )}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {formatDateShort(event.startsAt)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{event.place}</span>
            </span>
            <span>Dès {formatPrice(event.price)}</span>
          </div>
          {event.organizerId && event.organizerName && (
            <Link
              href={`/admin/organisateurs/${event.organizerId}`}
              className="mt-2 inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full bg-brand-50 px-2.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.organizerName}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="mx-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            <Smartphone className="h-3.5 w-3.5" /> Numériques
          </p>
          <p className="font-semibold text-slate-900">
            {event.ticketsSold}
            <span className="font-normal text-slate-400">/{event.capacity}</span>{" "}
            <span className={`text-xs font-semibold ${fill.text}`}>
              {percent} %
            </span>
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${fill.bar}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            <Printer className="h-3.5 w-3.5" /> Physiques
          </p>
          {event.physicalTickets > 0 ? (
            <>
              <p className="font-semibold text-slate-900">
                {event.physicalTickets}
              </p>
              <p className="text-[11px] text-slate-500">
                {event.physicalEntered} entrés
              </p>
            </>
          ) : (
            <p className="text-slate-300">—</p>
          )}
        </div>
      </div>

      <div className="mx-4 mb-4 mt-3 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-emerald-50/70 p-3 ring-1 ring-emerald-100">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-500">Revenus encaissés</p>
          <p className="text-lg font-bold text-slate-900">
            {formatAmount(event.revenue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">Commission</p>
          <p className="font-semibold text-brand-700">
            {formatAmount(event.commission)}
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-4 pt-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          Taux
          <EventCommissionEditor id={event.id} rate={event.commissionRate} />
        </div>
        <div className="flex items-center gap-2">
          {!published && (
            <AdminPublishEventButton id={event.id} title={event.title} />
          )}
          <AdminDeleteEventButton id={event.id} title={event.title} />
        </div>
      </div>
    </li>
  );
}

/** Section admin « Tous les événements » : résumé, recherche, filtres et cartes. */
export function AdminEvents({ events }: { events: AdminEventCard[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [when, setWhen] = useState<When>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [now] = useState(() => Date.now());

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

  const totals = useMemo(
    () =>
      events.reduce(
        (acc, e) => ({
          sold: acc.sold + e.ticketsSold,
          physical: acc.physical + e.physicalTickets,
          revenue: acc.revenue + e.revenue,
          commission: acc.commission + e.commission,
        }),
        { sold: 0, physical: 0, revenue: 0, commission: 0 },
      ),
    [events],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = events.filter((event) => {
      if (filter !== "all" && event.status !== filter) return false;
      if (when !== "all" && isPast(event.startsAt, now) !== (when === "past"))
        return false;
      if (!needle) return true;
      return [event.title, event.place, event.organizerName]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(needle));
    });
    if (sort === "date")
      list.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    if (sort === "revenue") list.sort((a, b) => b.revenue - a.revenue);
    if (sort === "sales") list.sort((a, b) => b.ticketsSold - a.ticketsSold);
    return list;
  }, [events, filter, when, sort, query, now]);

  const summary = [
    {
      label: "Publiés",
      value: `${counts.published}`,
      sub: `/ ${events.length}`,
      tone: "text-emerald-700",
    },
    {
      label: "À traiter",
      value: `${counts.pending + counts.draft}`,
      sub: "attente + brouillons",
      tone: "text-amber-600",
    },
    {
      label: "Billets",
      value: `${totals.sold}`,
      sub: `+ ${totals.physical} papier`,
      tone: "text-slate-900",
    },
    {
      label: "Revenus",
      value: formatAmount(totals.revenue),
      sub: `${formatAmount(totals.commission)} comm.`,
      tone: "text-slate-900",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 p-4 sm:items-center sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center font-semibold text-slate-900">
            Tous les événements
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {events.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Tous les statuts confondus. Publiez un brouillon, réglez la
            commission (%) ou supprimez définitivement un événement.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Aucun événement.
        </p>
      ) : (
        <div className="space-y-4 bg-slate-50/50 p-4 sm:p-5">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summary.map((s) => (
              <div
                key={s.label}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-3"
              >
                <dt className="text-xs text-slate-500">{s.label}</dt>
                <dd className={`text-base font-bold sm:text-xl ${s.tone}`}>
                  {s.value}
                </dd>
                <dd className="truncate text-[11px] text-slate-400">{s.sub}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Événement, ville ou organisateur"
                  aria-label="Rechercher un événement"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:h-10 sm:text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <select
                  value={when}
                  onChange={(e) => setWhen(e.target.value as When)}
                  aria-label="Filtrer par date"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 sm:h-10"
                >
                  {WHEN.map((w) => (
                    <option key={w.key} value={w.key}>
                      {w.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Trier les événements"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 sm:h-10"
                >
                  <option value="recent">Récents</option>
                  <option value="date">Date de l&apos;événement</option>
                  <option value="revenue">Revenus</option>
                  <option value="sales">Ventes</option>
                </select>
              </div>
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {FILTERS.map(({ key, label, chip }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={filter === key}
                  className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                    filter === key
                      ? `${chip} shadow-sm`
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
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
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
              Aucun événement ne correspond à cette recherche.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visible.map((event) => (
                <EventCard key={event.id} event={event} now={now} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
