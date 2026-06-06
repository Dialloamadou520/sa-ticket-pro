import type { Metadata } from "next";
import { CalendarDays, Users, Wallet, Percent } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { EventModeration } from "@/components/admin/event-moderation";
import {
  getAdminStats,
  getAllUsers,
  getPendingEvents,
} from "@/lib/data/admin";
import { formatDateShort, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminPage() {
  const [stats, pending, users] = await Promise.all([
    getAdminStats(),
    getPendingEvents(),
    getAllUsers(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="text-sm text-slate-500">
          Pilotez la plateforme Sa Ticket Pro.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value={stats.totalUsers.toLocaleString("fr-FR")} icon={Users} />
        <StatCard label="Événements" value={String(stats.totalEvents)} icon={CalendarDays} />
        <StatCard label="Revenus plateforme" value={formatPrice(stats.totalRevenue)} icon={Wallet} />
        <StatCard
          label="Commissions (10%)"
          value={formatPrice(stats.platformCommission)}
          icon={Percent}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
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
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    {event.city ?? event.location} ·{" "}
                    {formatDateShort(event.starts_at)} · {formatPrice(event.price)}
                  </p>
                </div>
                <EventModeration id={event.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
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
                  <tr key={u.id}>
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
