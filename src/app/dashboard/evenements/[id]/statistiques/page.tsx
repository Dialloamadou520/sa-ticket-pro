import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Gift, ScanLine, Ticket, Wallet } from "lucide-react";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { getEventSalesStats, getManageableEventById } from "@/lib/data/dashboard";
import { formatPrice } from "@/lib/format";
import { getTierTheme } from "@/lib/tier-theme";

export const metadata: Metadata = { title: "Statistiques" };

export default async function EventStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manageable = await getManageableEventById(id);
  if (!manageable) notFound();
  const { event, isOwner } = manageable;
  const stats = await getEventSalesStats(event);

  const tiles = [
    { label: "Billets vendus", value: stats.totalTickets.toLocaleString("fr-FR"), sub: `sur ${event.capacity}`, icon: Ticket, tone: "bg-brand-50 text-brand-700" },
    { label: "Entrées", value: stats.scanned.toLocaleString("fr-FR"), sub: stats.totalTickets ? `${Math.round((stats.scanned / stats.totalTickets) * 100)} % des vendus` : "—", icon: ScanLine, tone: "bg-sky-50 text-sky-700" },
    { label: "Invitations", value: stats.invitations.toLocaleString("fr-FR"), sub: `${stats.invitationsScanned} entrée${stats.invitationsScanned > 1 ? "s" : ""}`, icon: Gift, tone: "bg-purple-50 text-purple-700" },
    ...(isOwner
      ? [{ label: "Revenus billets", value: formatPrice(stats.totalRevenue), sub: "hors frais de service", icon: Wallet, tone: "bg-amber-50 text-amber-700" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/dashboard/evenements" className="hover:text-brand-600">
          Mes événements
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-700">Statistiques</span>
      </nav>

      <h1 className="text-xl font-bold break-words text-slate-900 sm:text-2xl">
        {event.title}
      </h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${t.tone}`}>
              <t.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xs text-slate-500">{t.label}</p>
            <p className="text-lg font-bold break-words text-slate-900">{t.value}</p>
            <p className="text-[11px] text-slate-400">{t.sub}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Ventes par jour</h2>
        {stats.daily.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Aucune vente pour le moment.
          </p>
        ) : (
          <SalesChart daily={stats.daily} showRevenue={isOwner} />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Répartition par catégorie</h2>
        {stats.categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Aucune vente pour le moment.
          </p>
        ) : (
          <ul className="space-y-4">
            {stats.categories.map((c) => {
              const pct = Math.round((c.tickets / stats.totalTickets) * 100);
              const theme = getTierTheme(c.name);
              return (
                <li key={c.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-slate-900">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${theme.dot}`} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {c.tickets} <span className="font-normal text-slate-500">· {pct} %</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${theme.dot}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.scanned} entrée{c.scanned > 1 ? "s" : ""}
                    {isOwner && <> · {formatPrice(c.revenue)}</>}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        {stats.invitations > 0 && (
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            + {stats.invitations} invitation{stats.invitations > 1 ? "s" : ""} gratuite
            {stats.invitations > 1 ? "s" : ""}, non comptée{stats.invitations > 1 ? "s" : ""} dans les ventes.
          </p>
        )}
      </section>
    </div>
  );
}
