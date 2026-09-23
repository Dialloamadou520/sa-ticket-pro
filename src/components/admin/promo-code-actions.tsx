"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Power, Trash2 } from "lucide-react";
import { deletePromoCode, setPromoCodeActive } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Activation/désactivation et suppression d'un code de vente. */
export function PromoCodeActions({
  id,
  code,
  active,
}: {
  id: string;
  code: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<void>, success: string) {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : codes promo désactivés.");
      return;
    }
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Action impossible.",
        );
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            () => setPromoCodeActive(id, !active),
            active ? `Code ${code} désactivé.` : `Code ${code} réactivé.`,
          )
        }
        title={active ? "Désactiver le code" : "Réactiver le code"}
        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:min-h-0 sm:px-2.5 sm:py-1.5"
      >
        <Power className="h-3.5 w-3.5" />
        {active ? "Désactiver" : "Réactiver"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              `Supprimer le code ${code} ? Les ventes déjà réalisées restent enregistrées.`,
            )
          ) {
            return;
          }
          run(() => deletePromoCode(id), `Code ${code} supprimé.`);
        }}
        title="Supprimer le code"
        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:min-h-0 sm:px-2.5 sm:py-1.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
