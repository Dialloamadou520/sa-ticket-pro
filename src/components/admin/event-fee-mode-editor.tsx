"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setEventFeeMode } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { FeeMode } from "@/lib/types";

const LABELS: Record<FeeMode, string> = {
  service_fee: "Barème standard",
  commission: "Commission 1,5 %",
  none: "Aucun frais",
};

/** Éditeur du mode de frais de service d'un événement, réservé admin. */
export function EventFeeModeEditor({
  id,
  mode,
}: {
  id: string;
  mode: FeeMode;
}) {
  const [value, setValue] = useState<FeeMode>(mode);
  const [pending, startTransition] = useTransition();

  function onChange(next: FeeMode) {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : réglage indisponible.");
      return;
    }
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        await setEventFeeMode(id, next);
        toast.success(`Frais mis à jour : ${LABELS[next]}.`);
      } catch {
        setValue(previous);
        toast.error("Mise à jour impossible. Réessayez.");
      }
    });
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FeeMode)}
      disabled={pending}
      aria-label="Mode de frais de service"
      className="rounded-lg border border-slate-300 py-1 pl-2 pr-7 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
    >
      <option value="service_fee">{LABELS.service_fee}</option>
      <option value="commission">{LABELS.commission}</option>
      <option value="none">{LABELS.none}</option>
    </select>
  );
}
