"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { setEventCommission } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Éditeur du taux de commission plateforme (%) d'un événement, réservé admin. */
export function EventCommissionEditor({
  id,
  rate,
}: {
  id: string;
  /** Taux effectif (0–1). */
  rate: number;
}) {
  const initial = String(Math.round(rate * 1000) / 10);
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  const parsed = Number(value.replace(",", "."));
  const dirty = value !== initial;
  const valid = Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;

  function save() {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : réglage indisponible.");
      return;
    }
    if (!valid) {
      toast.error("Taux invalide (0 à 100 %).");
      return;
    }
    startTransition(async () => {
      try {
        await setEventCommission(id, parsed / 100);
        toast.success(`Commission mise à jour (${parsed} %).`);
      } catch {
        toast.error("Mise à jour impossible. Réessayez.");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          aria-label="Taux de commission (%)"
          className="h-10 w-20 rounded-lg border border-slate-300 pl-2 pr-5 text-sm sm:h-auto sm:w-16 sm:py-1 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          %
        </span>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={pending || !dirty || !valid}
        title="Enregistrer le taux"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-40 sm:h-7 sm:w-7"
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}
