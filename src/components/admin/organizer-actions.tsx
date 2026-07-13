"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteOrganizer,
  removeOrganizer,
  restoreOrganizer,
  setOrganizerVerified,
} from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface Props {
  id: string;
  disabled: boolean;
  verified: boolean;
  /** Affiche aussi le bouton de vérification (page de détail). */
  showVerify?: boolean;
}

export function OrganizerActions({ id, disabled, verified, showVerify }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function guard(): boolean {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : gestion des organisateurs désactivée.");
      return false;
    }
    return true;
  }

  function toggleDisabled() {
    if (!guard()) return;
    if (
      !disabled &&
      !window.confirm(
        "Retirer cet organisateur ? Ses événements publiés seront annulés et masqués du public. Cette action est réversible.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        if (disabled) {
          await restoreOrganizer(id);
          toast.success("Organisateur réactivé.");
        } else {
          await removeOrganizer(id);
          toast.success("Organisateur retiré (événements annulés).");
        }
      } catch {
        toast.error("Action impossible. Réessayez.");
      }
    });
  }

  function onDelete() {
    if (!guard()) return;
    if (
      !window.confirm(
        "Supprimer définitivement cet organisateur ? Tous ses événements, tickets, paiements, contrôleurs et scans seront aussi supprimés. Cette action est irréversible.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteOrganizer(id);
        toast.success("Organisateur supprimé.");
        if (showVerify) router.push("/admin");
      } catch {
        toast.error("Suppression impossible. Réessayez.");
      }
    });
  }

  function toggleVerified() {
    if (!guard()) return;
    startTransition(async () => {
      try {
        await setOrganizerVerified(id, !verified);
        toast.success(verified ? "Vérification retirée." : "Organisateur vérifié.");
      } catch {
        toast.error("Action impossible. Réessayez.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showVerify && (
        <button
          onClick={toggleVerified}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {verified ? (
            <>
              <ShieldX className="h-4 w-4" />
              Retirer la vérif.
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Vérifier
            </>
          )}
        </button>
      )}
      {disabled ? (
        <button
          onClick={toggleDisabled}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Réactiver
        </button>
      ) : (
        <button
          onClick={toggleDisabled}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Ban className="h-4 w-4" />
          Retirer
        </button>
      )}
      <button
        onClick={onDelete}
        disabled={pending}
        className="flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer
      </button>
    </div>
  );
}
