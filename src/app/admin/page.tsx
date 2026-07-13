import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  Wallet,
  Percent,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Clock,
  Building2,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { EventModeration } from "@/components/admin/event-moderation";
import { AdminDeleteEventButton } from "@/components/admin/delete-event-button";
import { OrganizerActions } from "@/components/admin/organizer-actions";
import { ServiceFeesToggle } from "@/components/admin/service-fees-toggle";
import {
  getAdminStats,
  getAllEvents,
  getAllOrganizers,
  getAllUsers,
  getPendingEvents,
} from "@/lib/data/admin";
import type { EventStatus } from "@/lib/types";
import { getServiceFeesEnabled } from "@/lib/data/settings";
import { formatDateShort, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Administration" };

const STATUS_BADGE: Record<EventStatus, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-slate-100 text-slate-600" },
  pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
  published: { label: "Publié", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejeté", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Annulé", className: "bg-slate-100 text-slate-500" },
};

export default async function AdminPage() {
  const [stats, pending, allEvents, organizers, users, serviceFeesEnabled] =
    await Promise.all([
      getAdminStats(),
      getPendingEvents(),
      getAllEvents(),
      getAllOrganizers(),
      getAllUsers(),
      getServiceFeesEnabled(),
    ]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-800 px-6 py-7 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-accent-500/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
            <p className="text-sm text-white/70">
              Pilotez la plateforme kaypass.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Utilisateurs" value={stats.totalUsers.toLocaleString("fr-FR")} icon={Users} accent="blue" />
        <AdminStatCard label="Événements" value={String(stats.totalEvents)} icon={CalendarDays} accent="violet" />
        <AdminStatCard label="Revenus plateforme" value={formatPrice(stats.totalRevenue)} icon={Wallet} accent="emerald" />
        <AdminStatCard
          label="Commissions (10%)"
          value={formatPrice(stats.platformCommission)}
          icon={Percent}
          accent="amber"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Frais de service</h2>
              <p className="text-xs text-slate-500">
                Activez ou désactivez globalement les frais de service ajoutés au
                prix des tickets. Chaque événement peut aussi être réglé
                individuellement (frais standard, commission 1,5 % ou aucun).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                serviceFeesEnabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {serviceFeesEnabled ? "Activés" : "Désactivés"}
            </span>
            <ServiceFeesToggle enabled={serviceFeesEnabled} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </span>
          <h2 className="flex items-center font-semibold text-slate-900">
            Événements en attente de validation
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {pending.length}
            </span>
          </h2>
        </div>
        {pending.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun événement en attente.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    {event.city ?? event.location} ·{" "}
                    {formatDateShort(event.starts_at)} · {formatPrice(event.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <EventModeration id={event.id} />
                  <AdminDeleteEventButton id={event.id} title={event.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h2 className="flex items-center font-semibold text-slate-900">
              Tous les événements
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {allEvents.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Tous les événements de la plateforme, quel que soit leur statut.
              Vous pouvez en supprimer définitivement n&apos;importe lequel.
            </p>
          </div>
        </div>
        {allEvents.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun événement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Événement</th>
                  <th className="px-5 py-3">Organisateur</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allEvents.map((event) => {
                  const badge = STATUS_BADGE[event.status];
                  return (
                    <tr key={event.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          {event.city ?? event.location} · {formatPrice(event.price)}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        {event.organizer ? (
                          <Link
                            href={`/admin/organisateurs/${event.organizer.id}`}
                            className="text-slate-600 hover:text-brand-700"
                          >
                            {event.organizer.company_name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatDateShort(event.starts_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <AdminDeleteEventButton id={event.id} title={event.title} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="flex items-center font-semibold text-slate-900">
              Organisateurs
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {organizers.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Activité par organisateur. Retirez un organisateur pour annuler et
              masquer ses événements (réversible).
            </p>
          </div>
        </div>
        {organizers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {`La liste des organisateurs s'affichera ici une fois Supabase configuré.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Organisateur</th>
                  <th className="px-5 py-3">Événements</th>
                  <th className="px-5 py-3">Tickets</th>
                  <th className="px-5 py-3">Revenus</th>
                  <th className="px-5 py-3">Commission</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizers.map((o) => (
                  <tr
                    key={o.id}
                    className={`transition-colors hover:bg-slate-50 ${
                      o.disabled ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/organisateurs/${o.id}`}
                        className="flex items-center gap-1 font-medium text-slate-900 hover:text-brand-700"
                      >
                        {o.company_name}
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                      <p className="text-xs text-slate-500">
                        {o.owner?.full_name || "—"} · {o.owner?.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {o.eventsCount}
                      <span className="text-xs text-slate-400">
                        {" "}
                        ({o.publishedEvents} publiés)
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{o.ticketsSold}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatPrice(o.revenue)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatPrice(o.commission)}
                    </td>
                    <td className="px-5 py-3">
                      {o.disabled ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Retiré
                        </span>
                      ) : o.verified ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Vérifié
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <OrganizerActions
                          id={o.id}
                          disabled={o.disabled}
                          verified={o.verified}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Users className="h-5 w-5" />
          </span>
          <h2 className="font-semibold text-slate-900">Utilisateurs récents</h2>
        </div>
        {users.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {`La liste des utilisateurs s'affichera ici une fois Supabase configuré.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nom</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Rôle</th>
                  <th className="px-5 py-3">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {u.full_name || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3 capitalize text-slate-500">{u.role}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {formatDateShort(u.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
