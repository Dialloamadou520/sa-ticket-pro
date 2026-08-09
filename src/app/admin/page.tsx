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
  TrendingUp,
  MousePointerClick,
  BarChart3,
  TicketCheck,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { EventModeration } from "@/components/admin/event-moderation";
import { AdminDeleteEventButton } from "@/components/admin/delete-event-button";
import { EventCommissionEditor } from "@/components/admin/event-commission-editor";
import { EventFeeModeEditor } from "@/components/admin/event-fee-mode-editor";
import { VisitsChart } from "@/components/admin/visits-chart";
import { OrganizerActions } from "@/components/admin/organizer-actions";
import { OrganizersExport } from "@/components/admin/organizers-export";
import { ServiceFeesToggle } from "@/components/admin/service-fees-toggle";
import { UserRoleEditor } from "@/components/admin/user-role-editor";
import { AddAdminForm } from "@/components/admin/add-admin-form";
import {
  getAdminStats,
  getAllEvents,
  getAllOrganizers,
  getAllUsers,
  getMonthlyRevenue,
  getPendingEvents,
} from "@/lib/data/admin";
import { getVisitStats } from "@/lib/data/analytics";
import { getCurrentUser } from "@/lib/data/auth";
import type { EventStatus } from "@/lib/types";
import { getServiceFeesEnabled } from "@/lib/data/settings";
import { formatAmount, formatDateShort, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Administration" };

const STATUS_BADGE: Record<EventStatus, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-slate-100 text-slate-600" },
  pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
  published: { label: "Publié", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejeté", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Annulé", className: "bg-slate-100 text-slate-500" },
};

export default async function AdminPage() {
  const [
    stats,
    visits,
    pending,
    allEvents,
    monthlyRevenue,
    organizers,
    users,
    serviceFeesEnabled,
    currentUser,
  ] = await Promise.all([
    getAdminStats(),
    getVisitStats(),
    getPendingEvents(),
    getAllEvents(),
    getMonthlyRevenue(),
    getAllOrganizers(),
    getAllUsers(),
    getServiceFeesEnabled(),
    getCurrentUser(),
  ]);

  const maxTopPage = Math.max(1, ...visits.topPages.map((p) => p.count));

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-800 px-6 py-7 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-accent-500/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
            <p className="text-sm text-white/70">
              Pilotez la plateforme kaypass.
            </p>
          </div>
          <Link
            href="/admin/tickets"
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20"
          >
            <TicketCheck className="h-4 w-4" />
            Récupérer un ticket perdu
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Utilisateurs" value={stats.totalUsers.toLocaleString("fr-FR")} icon={Users} accent="blue" />
        <AdminStatCard label="Événements" value={String(stats.totalEvents)} icon={CalendarDays} accent="violet" />
        <AdminStatCard label="Revenus plateforme" value={formatAmount(stats.totalRevenue)} icon={Wallet} accent="emerald" />
        <AdminStatCard
          label="Commissions"
          value={formatAmount(stats.platformCommission)}
          icon={Percent}
          accent="amber"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">
              Fréquentation de la plateforme
            </h2>
            <p className="text-xs text-slate-500">
              Nombre de visites de pages (« clics ») sur la plateforme. Les pages
              d&apos;administration ne sont pas comptées.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            label="Visites totales"
            value={visits.total.toLocaleString("fr-FR")}
            icon={MousePointerClick}
            accent="rose"
          />
          <AdminStatCard
            label="Aujourd'hui"
            value={visits.today.toLocaleString("fr-FR")}
            icon={TrendingUp}
            accent="emerald"
          />
          <AdminStatCard
            label="7 derniers jours"
            value={visits.last7Days.toLocaleString("fr-FR")}
            icon={CalendarDays}
            accent="blue"
          />
          <AdminStatCard
            label="Visiteurs uniques (30 j)"
            value={visits.uniqueVisitors30.toLocaleString("fr-FR")}
            icon={Users}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 border-t border-slate-100 p-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Visites par jour
              </h3>
            </div>
            {visits.total === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Aucune visite enregistrée pour le moment.
              </p>
            ) : (
              <VisitsChart daily={visits.daily} />
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Pages les plus visitées
              </h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 shadow-sm">
                30 derniers jours
              </span>
            </div>
            {visits.topPages.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Aucune donnée pour le moment.
              </p>
            ) : (
              <ul className="space-y-2">
                {visits.topPages.map((p, i) => {
                  const pct = Math.round((p.count / maxTopPage) * 100);
                  return (
                    <li key={p.path} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          i === 0
                            ? "bg-brand-100 text-brand-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {p.label}
                          </p>
                          <span className="shrink-0 text-xs font-semibold text-slate-700">
                            {p.count.toLocaleString("fr-FR")}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h2 className="flex items-center font-semibold text-slate-900">
              Revenus par mois
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {monthlyRevenue.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Revenus encaissés par mois (paiements confirmés), du plus récent au
              plus ancien.
            </p>
          </div>
        </div>
        {monthlyRevenue.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun revenu enregistré pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Mois</th>
                  <th className="px-5 py-3">Tickets vendus</th>
                  <th className="px-5 py-3">Revenus</th>
                  <th className="px-5 py-3">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyRevenue.map((m) => (
                  <tr key={m.key} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium capitalize text-slate-900">
                      {m.label}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{m.ticketsSold}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {formatAmount(m.revenue)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatAmount(m.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
              Réglez les frais de service et la commission (%) par événement, ou
              supprimez-en définitivement n&apos;importe lequel.
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
                  <th className="px-5 py-3">Tickets</th>
                  <th className="px-5 py-3">Revenus</th>
                  <th className="px-5 py-3">Frais</th>
                  <th className="px-5 py-3">Taux</th>
                  <th className="px-5 py-3">Commission</th>
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
                      <td className="px-5 py-3 text-slate-600">
                        {event.tickets_sold}/{event.capacity}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatAmount(event.revenue)}
                      </td>
                      <td className="px-5 py-3">
                        <EventFeeModeEditor
                          id={event.id}
                          mode={event.fee_mode ?? "service_fee"}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <EventCommissionEditor
                          id={event.id}
                          rate={event.commissionRate}
                        />
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatAmount(event.commission)}
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
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5">
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
              Coordonnées et activité par organisateur. Retirez un organisateur
              pour annuler et masquer ses événements (réversible).
            </p>
          </div>
          <OrganizersExport organizers={organizers} />
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
                  <th className="px-5 py-3">Contact</th>
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
                        {o.owner?.full_name || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      {o.owner?.phone ? (
                        <a
                          href={`tel:${o.owner.phone.replace(/\s/g, "")}`}
                          className="font-medium text-slate-900 hover:text-brand-700"
                        >
                          {o.owner.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">Non renseigné</span>
                      )}
                      <p className="text-xs text-slate-500">
                        {o.owner?.email ?? "—"}
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
                      {formatAmount(o.revenue)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatAmount(o.commission)}
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
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900">Utilisateurs récents</h2>
            <p className="text-xs text-slate-500">
              {`Attribuez un rôle à un compte existant. Un administrateur a accès à tout : événements, organisateurs, revenus et rôles.`}
            </p>
          </div>
        </div>
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <AddAdminForm />
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
                  <th className="px-5 py-3">Téléphone</th>
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
                    <td className="px-5 py-3 text-slate-500">
                      {u.phone ? (
                        <a
                          href={`tel:${u.phone.replace(/\s/g, "")}`}
                          className="hover:text-brand-700"
                        >
                          {u.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <UserRoleEditor
                        userId={u.id}
                        role={u.role}
                        self={u.id === currentUser?.id}
                      />
                    </td>
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
