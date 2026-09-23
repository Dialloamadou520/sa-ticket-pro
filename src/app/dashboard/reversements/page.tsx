import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { PayoutPanel } from "@/components/dashboard/payout-panel";
import { getMyPayoutPage } from "@/lib/data/payouts";
import { PAYOUT_OPERATOR_LABELS, PAYOUT_STATUS_LABELS } from "@/lib/payments/payout";
import { formatAmount, formatDateShort } from "@/lib/format";
import type { PayoutStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Reversements" };

const STATUS_STYLES: Record<PayoutStatus, string> = {
  requested: "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default async function ReversementsPage() {
  const { organizer, balance, payouts } = await getMyPayoutPage();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Reversements
          </h1>
          <p className="text-sm text-slate-500">
            Recevez vos recettes directement sur votre compte Wave ou Orange
            Money.
          </p>
        </div>
      </div>

      {!organizer ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          Créez d&apos;abord un événement pour activer votre compte
          organisateur.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              { label: "Recettes encaissées", value: balance.revenue },
              { label: "Commission plateforme", value: -balance.commission },
              { label: "Déjà reversé", value: balance.paidOut },
              { label: "Disponible", value: balance.available },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 break-words text-lg font-bold text-slate-900 sm:text-xl">
                  {formatAmount(card.value)}
                </p>
              </div>
            ))}
          </div>

          {balance.pending > 0 && (
            <p className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-900">
              {formatAmount(balance.pending)} en cours de traitement.
            </p>
          )}

          <PayoutPanel
            payoutPhone={organizer.payout_phone ?? null}
            payoutOperator={organizer.payout_operator ?? null}
            available={balance.available}
          />

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Historique ({payouts.length})
            </div>
            {payouts.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                Aucun reversement pour le moment.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-slate-100 sm:hidden">
                  {payouts.map((p) => (
                    <li key={p.id} className="space-y-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {formatAmount(p.amount)}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}
                        >
                          {PAYOUT_STATUS_LABELS[p.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {PAYOUT_OPERATOR_LABELS[p.operator]} · {p.phone}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateShort(p.created_at)}
                      </p>
                      {p.failure_reason && (
                        <p className="text-xs text-red-600">
                          {p.failure_reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Montant</th>
                      <th className="px-5 py-3">Destination</th>
                      <th className="px-5 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map((p) => (
                      <tr key={p.id}>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDateShort(p.created_at)}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {formatAmount(p.amount)}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {PAYOUT_OPERATOR_LABELS[p.operator]} · {p.phone}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}
                          >
                            {PAYOUT_STATUS_LABELS[p.status]}
                          </span>
                          {p.failure_reason && (
                            <p className="mt-1 text-xs text-red-600">
                              {p.failure_reason}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
