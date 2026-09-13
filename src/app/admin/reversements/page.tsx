import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { PayoutActions } from "@/components/admin/payout-actions";
import { getAdminPayouts } from "@/lib/data/payouts";
import { isDexpayPayoutConfigured } from "@/lib/payments/dexpay";
import {
  PAYOUT_OPERATOR_LABELS,
  PAYOUT_STATUS_LABELS,
} from "@/lib/payments/payout";
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

export default async function AdminPayoutsPage() {
  const payouts = await getAdminPayouts();
  const canSend = isDexpayPayoutConfigured();
  const waiting = payouts.filter((p) => p.status === "requested");

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;administration
      </Link>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-semibold text-slate-900">
              Reversements aux organisateurs
            </h1>
            <p className="text-xs text-slate-500">
              {waiting.length} demande(s) en attente ·{" "}
              {formatAmount(waiting.reduce((s, p) => s + p.amount, 0))} à envoyer.
              Le virement part vers le compte Wave / Orange Money de
              l&apos;organisateur ; la commission de la plateforme est déjà
              déduite du solde.
            </p>
          </div>
        </div>

        {!canSend && (
          <p className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-800">
            Clés DexPay de reversement absentes (`DEXPAY_SECRET_KEY`) : le
            virement automatique est indisponible. Vous pouvez payer à la main
            puis utiliser « Marquer payé ».
          </p>
        )}

        {payouts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucune demande de reversement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Organisateur</th>
                  <th className="px-5 py-3">Montant</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Solde restant</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDateShort(p.created_at)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {p.organizerName}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {formatAmount(p.amount)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {PAYOUT_OPERATOR_LABELS[p.operator]} · {p.phone}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatAmount(p.available)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}
                      >
                        {PAYOUT_STATUS_LABELS[p.status]}
                      </span>
                      {p.failure_reason && (
                        <p className="mt-1 max-w-xs text-xs text-red-600">
                          {p.failure_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <PayoutActions
                        id={p.id}
                        status={p.status}
                        label={`${formatAmount(p.amount)} à ${p.organizerName}`}
                        canSend={canSend}
                      />
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
