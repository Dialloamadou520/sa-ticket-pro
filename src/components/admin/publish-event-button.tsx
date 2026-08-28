"use client";

import { useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { publishEventAsAdmin } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Publie directement un événement non publié (brouillon, refusé, annulé). */
export function AdminPublishEventButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function publish() {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : publication désactivée.");
      return;
    }
    if (
      !window.confirm(
        `Publier « ${title} » ? L'événement deviendra visible du public et les tickets seront en vente.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await publishEventAsAdmin(id);
        toast.success("Événement publié.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Publication impossible.",
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={publish}
      disabled={pending}
      title="Publier cet événement"
      className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
    >
      <Send className="h-3.5 w-3.5" />
      Publier
    </button>
  );
}
