import type { Metadata } from "next";
import { Tag, Trophy } from "lucide-react";
import { getMyPromoCodeStats } from "@/lib/data/dashboard";
import { formatAmount } from "@/lib/format";

export const metadata: Metadata = { title: "Codes promo" };

export default async function DashboardPromoCodesPage() {
  const codes = await getMyPromoCodeStats();
  const top = codes.find((c) => c.ticketsSold > 0) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Tag className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Codes promo</h1>
          <p className="text-sm text-slate-500">
            Ventes réalisées avec les codes utilisables sur vos événements.
            Consultation seule — la création et la modification des codes sont
            réservées à l&apos;administration.
          </p>
        </div>
      </div>

      {top && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Trophy className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            Meilleur vendeur : <strong>{top.owner_name}</strong> ({top.code}) —{" "}
            {top.ticketsSold} ticket(s) · {formatAmount(top.revenue)}
          </p>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="flex items-center font-semibold text-slate-900">
            Classement des ventes
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {codes.length}
            </span>
          </h2>
        </div>
        {codes.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun code promo ne concerne vos événements pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Collaborateur</th>
                  <th className="px-5 py-3">Événement</th>
                  <th className="px-5 py-3">Réduction</th>
                  <th className="px-5 py-3">Tickets vendus</th>
                  <th className="px-5 py-3">Chiffre d&apos;affaires</th>
                  <th className="px-5 py-3">Réductions</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {codes.map((c, i) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-5 py-3 font-mono font-medium text-slate-900">
                      {c.code}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{c.owner_name}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.eventTitle ?? "Tous les événements"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.discount_value <= 0
                        ? "Suivi seul"
                        : c.discount_type === "percent"
                          ? `-${c.discount_value} %`
                          : `-${formatAmount(c.discount_value)}`}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {c.ticketsSold}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {formatAmount(c.revenue)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatAmount(c.discountGiven)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {c.active ? "Actif" : "Inactif"}
                      </span>
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
