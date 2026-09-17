"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Ban, Check, RefreshCw, Send } from "lucide-react";
import {
  cancelPayout,
  markPayoutPaid,
  refreshPayoutStatus,
  sendPayout,
} from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { PayoutStatus } from "@/lib/types";

const BTN =
  "inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50";

/** Envoi, suivi, validation manuelle et annulation d'un reversement. */
export function PayoutActions({
  id,
  status,
  label,
  canSend,
}: {
  id: string;
  status: PayoutStatus;
  /** Description courte du reversement, pour les confirmations. */
  label: string;
  /** Faux si les clés DexPay de reversement ne sont pas configurées. */
  canSend: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<void>, success: string) {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : reversements désactivés.");
      return;
    }
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action impossible.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {status === "requested" && canSend && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(`Envoyer ${label} ? L'argent part immédiatement.`)) {
              return;
            }
            run(() => sendPayout(id), "Reversement envoyé.");
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Envoyer
        </button>
      )}

      {status === "processing" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => refreshPayoutStatus(id), "Statut actualisé.")}
          className={BTN}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualiser
        </button>
      )}

      {status !== "completed" && status !== "cancelled" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(`Marquer ${label} comme payé à la main ?`)) return;
            run(() => markPayoutPaid(id), "Reversement marqué payé.");
          }}
          className={BTN}
        >
          <Check className="h-3.5 w-3.5" />
          Marquer payé
        </button>
      )}

      {(status === "requested" || status === "failed") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => cancelPayout(id), "Demande annulée.")}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Ban className="h-3.5 w-3.5" />
          Annuler
        </button>
      )}
    </div>
  );
}
