"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  Printer,
  Search,
  Smartphone,
} from "lucide-react";
import { OrganizerActions } from "@/components/admin/organizer-actions";
import { OrganizersExport } from "@/components/admin/organizers-export";
import type { OrganizerWithStats } from "@/lib/data/admin";
import { formatAmount } from "@/lib/format";

type StatusFilter = "all" | "verified" | "active" | "removed";
type SortKey = "recent" | "revenue" | "events";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "verified", label: "Vérifiés" },
  { key: "active", label: "Non vérifiés" },
  { key: "removed", label: "Retirés" },
];

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function statusOf(o: OrganizerWithStats): Exclude<StatusFilter, "all"> {
  if (o.disabled) return "removed";
  return o.verified ? "verified" : "active";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

function avatarColor(id: string): string {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 9 ? `221${digits}` : digits}`;
}

function StatusBadge({ o }: { o: OrganizerWithStats }) {
  const status = statusOf(o);
  if (status === "removed") {
    return (
      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Retiré
      </span>
    );
  }
  if (status === "verified") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <BadgeCheck className="h-3.5 w-3.5" />
        Vérifié
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      Non vérifié
    </span>
  );
}

function OrganizerCard({ o }: { o: OrganizerWithStats }) {
  const phone = o.owner?.phone;
  const email = o.owner?.email;
  const contactClass =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 text-sm sm:px-3 font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 sm:min-h-9";

  return (
    <li
      className={`flex min-w-0 flex-col rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        o.disabled ? "border-red-200 bg-red-50/30" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        {o.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={o.logo_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold ${avatarColor(o.id)}`}
          >
            {initials(o.company_name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/admin/organisateurs/${o.id}`}
              className="group flex min-w-0 items-center gap-1 font-semibold text-slate-900 hover:text-brand-700"
            >
              <span className="truncate">{o.company_name}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <StatusBadge o={o} />
          </div>
          <p className="truncate text-sm text-slate-600">
            {o.owner?.full_name || "Responsable non renseigné"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {phone ?? "Numéro non renseigné"}
            {email ? ` · ${email}` : ""}
          </p>
        </div>
      </div>

      <div className="flex gap-2 px-4">
        {phone ? (
          <>
            <a href={`tel:${phone.replace(/\s/g, "")}`} className={contactClass}>
              <Phone className="h-4 w-4" />
              Appeler
            </a>
            <a
              href={whatsappUrl(phone)}
              target="_blank"
              rel="noopener noreferrer"
              className={contactClass}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </>
        ) : null}
        {email ? (
          <a href={`mailto:${email}`} className={contactClass}>
            <Mail className="h-4 w-4" />
            Email
          </a>
        ) : null}
      </div>

      <dl className="mx-4 mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-slate-100 text-center ring-1 ring-slate-100">
        <div className="bg-slate-50 px-2 py-2.5">
          <dt className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Événements
          </dt>
          <dd className="mt-0.5 font-semibold text-slate-900">
            {o.eventsCount}
            <span className="ml-1 text-xs font-normal text-slate-500">
              ({o.publishedEvents} publ.)
            </span>
          </dd>
        </div>
        <div className="bg-slate-50 px-2 py-2.5">
          <dt className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
            <Smartphone className="h-3.5 w-3.5" />
            Numériques
          </dt>
          <dd className="mt-0.5 font-semibold text-slate-900">
            {o.ticketsSold.toLocaleString("fr-FR")}
          </dd>
        </div>
        <div className="bg-slate-50 px-2 py-2.5">
          <dt className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
            <Printer className="h-3.5 w-3.5" />
            Physiques
          </dt>
          <dd className="mt-0.5 font-semibold text-slate-900">
            {o.physicalTickets > 0 ? (
              <>
                {o.physicalTickets.toLocaleString("fr-FR")}
                <span className="block text-[11px] font-normal text-slate-500">
                  {o.physicalEntered} entrés
                </span>
              </>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mx-4 mt-3 flex items-end justify-between gap-3 rounded-xl bg-brand-50/60 px-3 py-2.5">
        <div>
          <p className="text-[11px] text-slate-500">Revenus encaissés</p>
          <p className="text-lg font-bold leading-tight text-slate-900">
            {formatAmount(o.revenue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">Commission</p>
          <p className="font-semibold text-brand-700">
            {formatAmount(o.commission)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-4">
        <Link
          href={`/admin/organisateurs/${o.id}`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:min-h-0"
        >
          Voir l&apos;activité
          <ChevronRight className="h-4 w-4" />
        </Link>
        <OrganizerActions id={o.id} disabled={o.disabled} verified={o.verified} />
      </div>
    </li>
  );
}

export function AdminOrganizers({
  organizers,
}: {
  organizers: OrganizerWithStats[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const counts = useMemo(() => {
    const c = { all: organizers.length, verified: 0, active: 0, removed: 0 };
    for (const o of organizers) c[statusOf(o)] += 1;
    return c;
  }, [organizers]);

  const totals = useMemo(
    () =>
      organizers.reduce(
        (t, o) => ({
          revenue: t.revenue + o.revenue,
          commission: t.commission + o.commission,
        }),
        { revenue: 0, commission: 0 },
      ),
    [organizers],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = organizers.filter((o) => {
      if (filter !== "all" && statusOf(o) !== filter) return false;
      if (!q) return true;
      return [o.company_name, o.owner?.full_name, o.owner?.email, o.owner?.phone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
    if (sort === "revenue") return [...list].sort((a, b) => b.revenue - a.revenue);
    if (sort === "events")
      return [...list].sort((a, b) => b.eventsCount - a.eventsCount);
    return list;
  }, [organizers, query, filter, sort]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start gap-3 border-b border-slate-100 p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center font-semibold text-slate-900">
            Organisateurs
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {organizers.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Coordonnées et activité de chaque organisateur. « Retirer » annule
            et masque ses événements, et reste réversible.
          </p>
        </div>
        <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
          <OrganizersExport organizers={organizers} />
        </div>
      </div>

      {organizers.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          {`La liste des organisateurs s'affichera ici une fois Supabase configuré.`}
        </p>
      ) : (
        <div className="space-y-4 bg-slate-50/60 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Vérifiés</p>
              <p className="text-lg font-bold sm:text-xl text-emerald-700">
                {counts.verified}
                <span className="text-sm font-normal text-slate-400">
                  {" "}
                  / {counts.all}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Retirés</p>
              <p
                className={`text-lg font-bold sm:text-xl ${counts.removed ? "text-red-600" : "text-slate-900"}`}
              >
                {counts.removed}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Revenus encaissés</p>
              <p className="text-base font-bold text-slate-900 sm:text-xl">
                {formatAmount(totals.revenue)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Commissions</p>
              <p className="text-base font-bold text-brand-700 sm:text-xl">
                {formatAmount(totals.commission)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Rechercher un organisateur</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom, responsable, email ou téléphone"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:text-sm"
              />
            </label>
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap">
              <div className="-mx-1 flex min-w-0 flex-1 basis-full gap-1 overflow-x-auto px-1 sm:basis-auto lg:flex-none">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors sm:h-9 ${
                      filter === f.key
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`rounded-full px-1.5 text-xs ${
                        filter === f.key ? "bg-white/20" : "bg-slate-100"
                      }`}
                    >
                      {counts[f.key]}
                    </span>
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Trier les organisateurs"
                className="h-11 w-full shrink-0 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 sm:h-9 sm:w-auto"
              >
                <option value="recent">Récents</option>
                <option value="revenue">Revenus</option>
                <option value="events">Événements</option>
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
              Aucun organisateur ne correspond à cette recherche.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visible.map((o) => (
                <OrganizerCard key={o.id} o={o} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
