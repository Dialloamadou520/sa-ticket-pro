"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldPlus } from "lucide-react";
import { setUserRoleByEmail } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/components/admin/user-role-editor";

/** Attribue un rôle (admin par défaut) à un compte existant, par email. */
export function AddAdminForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : gestion des rôles désactivée.");
      return;
    }
    if (!email.trim()) {
      toast.error("Renseignez un email.");
      return;
    }
    if (
      role === "admin" &&
      !window.confirm(
        `Donner l'accès administrateur à ${email.trim()} ? Cette personne pourra tout gérer : événements, organisateurs, revenus et rôles.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const result = await setUserRoleByEmail(email, role);
        toast.success(
          `${result?.name ?? email} est maintenant ${ROLE_LABELS[role].toLowerCase()}.`,
        );
        setEmail("");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Attribution impossible.",
        );
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@exemple.com"
        disabled={pending}
        aria-label="Email de la personne"
        className="min-w-56 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        disabled={pending}
        aria-label="Rôle à attribuer"
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
      >
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        <ShieldPlus className="h-4 w-4" />
        Ajouter
      </button>
    </form>
  );
}
