"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { setUserRole } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/lib/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  participant: "Participant",
  organizer: "Organisateur",
  admin: "Administrateur",
};

/** Sélecteur du rôle d'un utilisateur, réservé admin. */
export function UserRoleEditor({
  userId,
  role,
  self,
}: {
  userId: string;
  role: UserRole;
  /** Vrai pour la ligne de l'admin connecté : son propre rôle n'est pas modifiable. */
  self?: boolean;
}) {
  const [value, setValue] = useState<UserRole>(role);
  const [saved, setSaved] = useState<UserRole>(role);
  const [pending, startTransition] = useTransition();

  if (self) {
    return (
      <span className="text-slate-500">
        {ROLE_LABELS[role]}
        <span className="ml-1 text-xs text-slate-400">(vous)</span>
      </span>
    );
  }

  function save() {
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : gestion des rôles désactivée.");
      return;
    }
    if (
      value === "admin" &&
      !window.confirm(
        "Donner l'accès administrateur à cette personne ? Elle pourra tout gérer : événements, organisateurs, revenus et rôles.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await setUserRole(userId, value);
        setSaved(value);
        toast.success(`Rôle mis à jour : ${ROLE_LABELS[value]}.`);
      } catch (error) {
        setValue(saved);
        toast.error(
          error instanceof Error ? error.message : "Mise à jour impossible.",
        );
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value as UserRole)}
        disabled={pending}
        aria-label="Rôle de l'utilisateur"
        className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
      >
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={save}
        disabled={pending || value === saved}
        title="Enregistrer le rôle"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-40"
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}
