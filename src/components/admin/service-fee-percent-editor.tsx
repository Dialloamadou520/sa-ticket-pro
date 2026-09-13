"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setServiceFeePercent } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_FEE_PERCENT } from "@/lib/payments/commission";

/** Réglage du pourcentage global des frais de service, réservé admin. */
export function ServiceFeePercentEditor({ percent }: { percent: number }) {
  const [value, setValue] = useState(String(percent));
  const [pending, startTransition] = useTransition();

  function save() {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : réglage indisponible.");
      return;
    }
    const next = Number(value.replace(",", "."));
    if (!Number.isFinite(next) || next < DEFAULT_FEE_PERCENT || next > 100) {
      toast.error(`Entrez un pourcentage entre ${DEFAULT_FEE_PERCENT} et 100.`);
      setValue(String(percent));
      return;
    }
    startTransition(async () => {
      try {
        await setServiceFeePercent(next);
        toast.success(`Frais de service : ${next} %.`);
      } catch (error) {
        setValue(String(percent));
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
          min={DEFAULT_FEE_PERCENT}
          max={100}
          step={0.1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          aria-label="Pourcentage des frais de service"
          className="w-28 rounded-lg border border-slate-300 py-1.5 pl-3 pr-7 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
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
