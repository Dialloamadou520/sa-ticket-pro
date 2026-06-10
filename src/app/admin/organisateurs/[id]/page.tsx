import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Ticket as TicketIcon,
  Wallet,
  Percent,
  ScanLine,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrganizerActions } from "@/components/admin/organizer-actions";
import { getOrganizerActivity } from "@/lib/data/admin";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import { formatDateShort, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Organisateur" };

export default async function OrganizerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getOrganizerActivity(id);
  if (!activity) notFound();

  const { organizer, events, payments, scansCount } = activity;
  const paidPayments = payments.filter((p) => p.status === "paid");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;administration
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {organizer.company_name}
              </h1>
              {organizer.disabled ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  Retiré
                </span>
              ) : organizer.verified ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Vérifié
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Actif
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {organizer.owner?.full_name || "—"} · {organizer.owner?.email ?? "—"}
              {organizer.owner?.phone ? ` · ${organizer.owner.phone}` : ""}
            </p>
            <p className="text-xs text-slate-400">
              Inscrit le {formatDateShort(organizer.created_at)}
            </p>
          </div>
          <OrganizerActions
            id={organizer.id}
            disabled={organizer.disabled}
            verified={organizer.verified}
            showVerify
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Événements"
          value={String(organizer.eventsCount)}
          icon={CalendarDays}
          hint={`${organizer.publishedEvents} publiés`}
        />
        <StatCard
          label="Tickets vendus"
          value={String(organizer.ticketsSold)}
          icon={TicketIcon}
        />
        <StatCard
          label="Revenus"
          value={formatPrice(organizer.revenue)}
          icon={Wallet}
        />
        <StatCard
          label="Commission (10%)"
          value={formatPrice(organizer.commission)}
          icon={Percent}
        />
        <StatCard label="Scans (entrées)" value={String(scansCount)} icon={ScanLine} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Événements
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {events.length}
            </span>
          </h2>
        </div>
        {events.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun événement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Titre</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Prix</th>
                  <th className="px-5 py-3">Vendus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">{e.title}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {formatDateShort(e.starts_at)}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {EVENT_STATUS_LABELS[e.status] ?? e.status}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatPrice(e.price)}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {e.tickets_sold} / {e.capacity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Paiements
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {payments.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            {paidPayments.length} payé(s) · {formatPrice(organizer.revenue)} encaissés
          </p>
        </div>
        {payments.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun paiement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Acheteur</th>
                  <th className="px-5 py-3">Montant</th>
                  <th className="px-5 py-3">Fournisseur</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.slice(0, 50).map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-slate-500">
                      {formatDateShort(p.created_at)}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {p.guest_email ?? p.guest_name ?? "Compte"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatPrice(p.amount)}</td>
                    <td className="px-5 py-3 capitalize text-slate-500">{p.provider}</td>
                    <td className="px-5 py-3 text-slate-500">{p.status}</td>
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
