"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setServiceFeesEnabled } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function ServiceFeesToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : réglage indisponible.");
      return;
    }
    const next = !on;
    setOn(next);
    startTransition(async () => {
      try {
        await setServiceFeesEnabled(next);
        toast.success(
          next ? "Frais de service activés." : "Frais de service désactivés."
        );
      } catch {
        setOn(!next);
        toast.error("Action impossible. Réessayez.");
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={pending}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        on ? "bg-brand-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
