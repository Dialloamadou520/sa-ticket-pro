"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setTierFeePercent } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MIN_FEE_PERCENT } from "@/lib/payments/commission";

/**
 * Frais de service d'une catégorie de ticket, réservé admin. Champ vide = la
 * catégorie suit le pourcentage global de la plateforme.
 */
export function TierFeePercentEditor({
  tierId,
  percent,
  globalPercent,
}: {
  tierId: string;
  percent: number | null;
  globalPercent: number;
}) {
  const [value, setValue] = useState(percent === null ? "" : String(percent));
  const [pending, startTransition] = useTransition();

  function save() {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : réglage indisponible.");
      return;
    }
    const raw = value.trim();
    const next = raw === "" ? null : Number(raw.replace(",", "."));
    if (
      next !== null &&
      (!Number.isFinite(next) || next < MIN_FEE_PERCENT || next > 100)
    ) {
      toast.error(`Entrez un pourcentage entre ${MIN_FEE_PERCENT} et 100.`);
      setValue(percent === null ? "" : String(percent));
      return;
    }
    startTransition(async () => {
      try {
        await setTierFeePercent(tierId, next);
        toast.success(
          next === null
            ? `Catégorie alignée sur le taux global (${globalPercent} %).`
            : next === 0
              ? "Aucun frais sur cette catégorie (0 %)."
              : `Frais de cette catégorie : ${next} %.`,
        );
      } catch (error) {
        setValue(percent === null ? "" : String(percent));
        toast.error(
          error instanceof Error ? error.message : "Mise à jour impossible.",
        );
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="number"
          min={MIN_FEE_PERCENT}
          max={100}
          step={0.1}
          value={value}
          placeholder={`${globalPercent} (global)`}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          aria-label="Frais de cette catégorie en pourcentage"
          className="w-36 rounded-lg border border-slate-300 py-1.5 pl-3 pr-7 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          %
        </span>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        Enregistrer
      </button>
    </div>
  );
}
