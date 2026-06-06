"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { approveEvent, rejectEvent } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function EventModeration({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function run(action: "approve" | "reject") {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : modération désactivée.");
      return;
    }
    startTransition(async () => {
      if (action === "approve") {
        await approveEvent(id);
        toast.success("Événement publié.");
      } else {
        await rejectEvent(id);
        toast.success("Événement refusé.");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => run("approve")}
        disabled={pending}
        className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        Approuver
      </button>
      <button
        onClick={() => run("reject")}
        disabled={pending}
        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <X className="h-4 w-4" />
        Refuser
      </button>
    </div>
  );
}
