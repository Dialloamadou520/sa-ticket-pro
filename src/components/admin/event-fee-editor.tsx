"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setEventFeePayer, setEventFeePercent } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MIN_FEE_PERCENT } from "@/lib/payments/commission";
import type { FeePayer } from "@/lib/types";

/**
 * Frais de service d'un événement, réservé admin : taux propre (champ vide =
 * taux global) et partie qui les supporte (acheteur ou organisateur).
 */
export function EventFeeEditor({
  eventId,
  percent,
  payer,
  globalPercent,
}: {
  eventId: string;
  percent: number | null;
  payer: FeePayer;
  globalPercent: number;
}) {
  const [value, setValue] = useState(percent === null ? "" : String(percent));
  const [currentPayer, setCurrentPayer] = useState<FeePayer>(payer);
  const [pending, startTransition] = useTransition();

  function savePercent() {
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
        await setEventFeePercent(eventId, next);
        toast.success(
          next === null
            ? `Événement aligné sur le taux global (${globalPercent} %).`
            : next === 0
              ? "Aucun frais sur cet événement (0 %)."
              : `Frais de cet événement : ${next} %.`,
        );
      } catch (error) {
        setValue(percent === null ? "" : String(percent));
        toast.error(
          error instanceof Error ? error.message : "Mise à jour impossible.",
        );
      }
    });
  }

  function savePayer(next: FeePayer) {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : réglage indisponible.");
      return;
    }
    const previous = currentPayer;
    setCurrentPayer(next);
    startTransition(async () => {
      try {
        await setEventFeePayer(eventId, next);
        toast.success(
          next === "organizer"
            ? "Frais à la charge de l'organisateur (retenus sur ses revenus)."
            : "Frais à la charge de l'acheteur (ajoutés au prix).",
        );
      } catch (error) {
        setCurrentPayer(previous);
        toast.error(
          error instanceof Error ? error.message : "Mise à jour impossible.",
        );
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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
          aria-label="Frais de cet événement en pourcentage"
          className="w-36 rounded-lg border border-slate-300 py-1.5 pl-3 pr-7 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          %
        </span>
      </div>
      <button
        type="button"
        onClick={savePercent}
        disabled={pending}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        Enregistrer
      </button>
      <select
        value={currentPayer}
        onChange={(e) => savePayer(e.target.value as FeePayer)}
        disabled={pending}
        aria-label="Qui paie les frais de cet événement"
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
      >
        <option value="buyer">Payés par l&apos;acheteur</option>
        <option value="organizer">Payés par l&apos;organisateur</option>
      </select>
    </div>
  );
}
