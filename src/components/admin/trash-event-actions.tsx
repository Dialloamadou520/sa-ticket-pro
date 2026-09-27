"use client";

import { useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { purgeEventAsAdmin, restoreEventAsAdmin } from "@/app/admin/actions";

/** Restaurer / supprimer définitivement un événement de la corbeille. */
export function TrashEventActions({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  const run = (action: "restore" | "purge") => {
    if (action === "purge") {
      const ok = window.confirm(
        `Supprimer définitivement « ${title} » ? Cette fois, aucune récupération ne sera possible.`,
      );
      if (!ok) return;
    }
    startTransition(async () => {
      try {
        if (action === "restore") {
          await restoreEventAsAdmin(id);
          toast.success("Événement restauré.");
        } else {
          await purgeEventAsAdmin(id);
          toast.success("Événement définitivement supprimé.");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Action impossible. Réessayez.",
        );
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("restore")}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4" />
        Restaurer
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("purge")}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-100 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer
      </button>
    </div>
  );
}
