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
  TrendingUp,
  MousePointerClick,
  BarChart3,
  TicketCheck,
  Tag,
  Trash2,
  BellRing,
  MessageSquare,
  Smartphone,
  Printer,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminEvents } from "@/components/admin/admin-events";
import { EventModeration } from "@/components/admin/event-moderation";
import { AdminDeleteEventButton } from "@/components/admin/delete-event-button";
import { VisitsChart } from "@/components/admin/visits-chart";
import { AdminOrganizers } from "@/components/admin/admin-organizers";
import { ServiceFeePercentEditor } from "@/components/admin/service-fee-percent-editor";
import { AdminUsers } from "@/components/admin/admin-users";
import {
  getAdminStats,
  getAllEvents,
  getAllOrganizers,
  getAllUsers,
  getMonthlyRevenue,
  getPendingEvents,
} from "@/lib/data/admin";
import { getVisitStats } from "@/lib/data/analytics";
import { getPendingPayoutAlert } from "@/lib/data/payouts";
import { getUnhandledContactCount } from "@/lib/data/contact";
import { getCurrentUser } from "@/lib/data/auth";
import { getServiceFeePercent } from "@/lib/data/settings";
import { formatAmount, formatDateShort, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Administration" };

const HERO_LINK_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20 sm:min-h-0 sm:justify-start sm:py-2.5";

export default async function AdminPage() {
  const [
    stats,
    visits,
    pending,
    allEvents,
    monthlyRevenue,
    organizers,
    users,
    serviceFeePercent,
    currentUser,
    payoutAlert,
    unhandledMessages,
  ] = await Promise.all([
    getAdminStats(),
    getVisitStats(),
    getPendingEvents(),
    getAllEvents(),
    getMonthlyRevenue(),
    getAllOrganizers(),
    getAllUsers(),
    getServiceFeePercent(),
    getCurrentUser(),
    getPendingPayoutAlert(),
    getUnhandledContactCount(),
  ]);

  const maxTopPage = Math.max(1, ...visits.topPages.map((p) => p.count));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-800 px-5 py-6 text-white shadow-sm sm:px-6 sm:py-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-accent-500/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur sm:h-12 sm:w-12">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Administration
            </h1>
            <p className="text-sm text-white/70">
              Pilotez la plateforme kaypass.
            </p>
          </div>
          <div className="ml-auto grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Link href="/admin/codes-promo" className={HERO_LINK_CLASS}>
              <Tag className="h-4 w-4" />
              Codes promo
            </Link>
            <Link href="/admin/reversements" className={HERO_LINK_CLASS}>
              <Wallet className="h-4 w-4" />
              Reversements
              {payoutAlert.count > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                  {payoutAlert.count}
                </span>
              )}
            </Link>
            <Link href="/admin/tickets" className={HERO_LINK_CLASS}>
              <TicketCheck className="h-4 w-4" />
              Récupérer un ticket perdu
            </Link>
            <Link href="/admin/messages" className={HERO_LINK_CLASS}>
              <MessageSquare className="h-4 w-4" />
              Messages
              {unhandledMessages > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                  {unhandledMessages}
                </span>
              )}
            </Link>
            <Link href="/admin/corbeille" className={HERO_LINK_CLASS}>
              <Trash2 className="h-4 w-4" />
              Corbeille
            </Link>
          </div>
        </div>
      </div>

      {payoutAlert.count > 0 && (
        <Link
          href="/admin/reversements"
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100 sm:items-center sm:p-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <BellRing className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {payoutAlert.count} demande(s) de reversement à traiter ·{" "}
              {formatAmount(payoutAlert.total)}
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              {payoutAlert.latest
                .map((p) => `${p.organizerName} (${formatAmount(p.amount)})`)
                .join(" · ")}
              {payoutAlert.count > payoutAlert.latest.length && " …"}
            </p>
          </div>
          <ChevronRight className="hidden h-5 w-5 shrink-0 text-amber-600 sm:block" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <AdminStatCard
          label="Utilisateurs"
          value={stats.totalUsers.toLocaleString("fr-FR")}
          icon={Users}
          accent="blue"
        />
        <AdminStatCard
          label="Événements"
          value={String(stats.totalEvents)}
          icon={CalendarDays}
          accent="violet"
        />
        <AdminStatCard
          label="Revenus plateforme"
          value={formatAmount(stats.totalRevenue)}
          icon={Wallet}
          accent="emerald"
        />
        <AdminStatCard
          label="Commissions"
          value={formatAmount(stats.platformCommission)}
          icon={Percent}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <AdminStatCard
          label="Tickets numériques"
          value={stats.onlineTickets.toLocaleString("fr-FR")}
          hint="Achetés en ligne"
          icon={Smartphone}
          accent="blue"
        />
        <AdminStatCard
          label="Tickets physiques"
          value={stats.physicalTickets.toLocaleString("fr-FR")}
          hint={`${stats.physicalEntered.toLocaleString("fr-FR")} entrés · hors revenus`}
          icon={Printer}
          accent="violet"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">
              Fréquentation de la plateforme
            </h2>
            <p className="text-xs text-slate-500">
              Nombre de visites de pages (« clics ») sur la plateforme. Les
              pages d&apos;administration ne sont pas comptées.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-5 lg:grid-cols-4">
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

        <div className="grid gap-4 border-t border-slate-100 p-4 sm:gap-6 sm:p-5 lg:grid-cols-2">
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
              Revenus encaissés par mois (paiements confirmés), du plus récent
              au plus ancien.
            </p>
          </div>
        </div>
        {monthlyRevenue.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun revenu enregistré pour le moment.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 sm:hidden">
              {monthlyRevenue.map((m) => (
                <li key={m.key} className="space-y-2 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium capitalize text-slate-900">
                      {m.label}
                    </p>
                    <p className="shrink-0 font-semibold text-slate-900">
                      {formatAmount(m.revenue)}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {m.ticketsSold} tickets · commission{" "}
                    {formatAmount(m.commission)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto sm:block">
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
                    <tr
                      key={m.key}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3 font-medium capitalize text-slate-900">
                        {m.label}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {m.ticketsSold}
                      </td>
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
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Frais de service</h2>
              <p className="text-xs text-slate-500">
                Pourcentage ajouté au prix de chaque ticket et payé par
                l&apos;acheteur. S&apos;applique à tous les événements. De 0 %
                (aucun frais) à 100 %.{" "}
                <Link
                  href="/admin/frais"
                  className="font-medium text-brand-700 hover:underline"
                >
                  Régler par catégorie de ticket
                </Link>
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {serviceFeePercent} % par ticket
            </span>
            <ServiceFeePercentEditor percent={serviceFeePercent} />
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
                className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    {event.city ?? event.location} ·{" "}
                    {formatDateShort(event.starts_at)} ·{" "}
                    {formatPrice(event.price)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <EventModeration id={event.id} />
                  <AdminDeleteEventButton id={event.id} title={event.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AdminEvents
        events={allEvents.map((event) => ({
          id: event.id,
          slug: event.slug,
          title: event.title,
          bannerUrl: event.banner_url,
          place: event.city ?? event.location,
          price: event.price,
          startsAt: event.starts_at,
          status: event.status,
          ticketsSold: event.tickets_sold,
          capacity: event.capacity,
          physicalTickets: event.physical.generated,
          physicalEntered: event.physical.entered,
          revenue: event.revenue,
          commission: event.commission,
          commissionRate: event.commissionRate,
          organizerId: event.organizer?.id ?? null,
          organizerName: event.organizer?.company_name ?? null,
        }))}
      />

      <AdminOrganizers organizers={organizers} />

      <AdminUsers users={users} currentUserId={currentUser?.id ?? null} />
    </div>
  );
}
