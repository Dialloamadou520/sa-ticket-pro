"use client";

import { useTransition } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteContactMessage,
  setContactMessageHandled,
} from "@/app/admin/actions";

const BUTTON_CLASS =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors disabled:opacity-50 sm:min-h-9 sm:flex-none";

export function ContactMessageActions({
  id,
  handled,
}: {
  id: string;
  handled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      await setContactMessageHandled(id, !handled);
      toast.success(handled ? "Message rouvert." : "Message marqué traité.");
    });

  const remove = () => {
    if (!window.confirm("Supprimer définitivement ce message ?")) return;
    startTransition(async () => {
      await deleteContactMessage(id);
      toast.success("Message supprimé.");
    });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={toggle}
        disabled={pending}
        className={`${BUTTON_CLASS} ${
          handled
            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        {handled ? (
          <>
            <RotateCcw className="h-4 w-4" />
            Rouvrir
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Traité
          </>
        )}
      </button>
      <button
        onClick={remove}
        disabled={pending}
        className={`${BUTTON_CLASS} bg-rose-50 text-rose-700 hover:bg-rose-100`}
      >
        <Trash2 className="h-4 w-4" />
        Supprimer
      </button>
    </div>
  );
}
