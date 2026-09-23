"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEventAsAdmin } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AdminDeleteEventButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : suppression désactivée.");
      return;
    }
    if (
      !window.confirm(
        `Supprimer définitivement « ${title} » ? Ses tickets, paiements et scans seront aussi supprimés. Cette action est irréversible.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteEventAsAdmin(id);
        toast.success("Événement supprimé.");
      } catch {
        toast.error("Suppression impossible. Réessayez.");
      }
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:min-h-0 sm:py-1.5"
    >
      <Trash2 className="h-4 w-4" />
      Supprimer
    </button>
  );
}
