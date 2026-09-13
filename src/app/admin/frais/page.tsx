import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import { ServiceFeePercentEditor } from "@/components/admin/service-fee-percent-editor";
import { TierFeePercentEditor } from "@/components/admin/tier-fee-percent-editor";
import { getEventsWithTiers } from "@/lib/data/admin";
import { getServiceFeePercent } from "@/lib/data/settings";
import { feeForUnitPrice, resolveFeePercent } from "@/lib/payments/commission";
import { formatAmount } from "@/lib/format";

export const metadata: Metadata = { title: "Frais de service" };

export default async function AdminFeesPage() {
  const [globalPercent, events] = await Promise.all([
    getServiceFeePercent(),
    getEventsWithTiers(),
  ]);
  const withTiers = events.filter((e) => e.tiers.length > 0);

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
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-semibold text-slate-900">
                Frais de service — taux global
              </h1>
              <p className="text-xs text-slate-500">
                Pourcentage ajouté au prix de chaque ticket et payé par
                l&apos;acheteur. De 0 % (aucun frais) à 100 %. S&apos;applique à
                toutes les catégories qui n&apos;ont pas de taux propre.
              </p>
            </div>
          </div>
          <ServiceFeePercentEditor percent={globalPercent} />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900">
            Frais par catégorie de ticket
          </h2>
          <p className="text-xs text-slate-500">
            Laissez le champ vide pour suivre le taux global ({globalPercent} %).
          </p>
        </div>
        {withTiers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun événement avec des catégories de tickets.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {withTiers.map((event) => (
              <div key={event.id} className="p-5">
                <h3 className="mb-3 font-medium text-slate-900">
                  {event.title}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="py-2 pr-4">Catégorie</th>
                        <th className="py-2 pr-4">Prix</th>
                        <th className="py-2 pr-4">Frais appliqués</th>
                        <th className="py-2 pr-4">Total acheteur</th>
                        <th className="py-2">Taux de cette catégorie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {event.tiers.map((tier) => {
                        const percent = resolveFeePercent(
                          tier.fee_percent,
                          globalPercent,
                        );
                        const fee = feeForUnitPrice(tier.price, percent);
                        return (
                          <tr key={tier.id}>
                            <td className="py-3 pr-4 font-medium text-slate-900">
                              {tier.name}
                            </td>
                            <td className="py-3 pr-4 text-slate-700">
                              {formatAmount(tier.price)}
                            </td>
                            <td className="py-3 pr-4 text-slate-600">
                              {formatAmount(fee)}{" "}
                              <span className="text-xs text-slate-400">
                                ({percent} %
                                {tier.fee_percent == null ? " — global" : ""})
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-slate-700">
                              {formatAmount(tier.price + fee)}
                            </td>
                            <td className="py-3">
                              <TierFeePercentEditor
                                tierId={tier.id}
                                percent={tier.fee_percent ?? null}
                                globalPercent={globalPercent}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
