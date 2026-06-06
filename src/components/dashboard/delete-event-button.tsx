"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEvent } from "@/app/dashboard/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function DeleteEventButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : suppression désactivée.");
      return;
    }
    if (!confirm("Supprimer définitivement cet événement ?")) return;
    startTransition(async () => {
      await deleteEvent(id);
      toast.success("Événement supprimé.");
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      Supprimer
    </button>
  );
}
