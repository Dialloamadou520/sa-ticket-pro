"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Trash2, UserPlus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  addCollaborator,
  removeCollaborator,
  type CollaboratorFormState,
} from "@/app/dashboard/actions";
import type { EventCollaborator } from "@/lib/types";

interface Props {
  eventId: string;
  collaborators: EventCollaborator[];
}

export function EventCollaborators({ eventId, collaborators }: Props) {
  const action = addCollaborator.bind(null, eventId);
  const [state, formAction, pending] = useActionState<
    CollaboratorFormState,
    FormData
  >(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast.success("Co-organisateur ajouté.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function onRemove(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await removeCollaborator(eventId, id);
      toast.success("Co-organisateur retiré.");
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        action={formAction}
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Ajouter un co-organisateur
        </label>
        <p className="mb-3 text-xs text-slate-400">
          Saisissez l&apos;email du co-organisateur. Après connexion (ou
          inscription) avec cet email, il pourra gérer cet événement (modifier,
          participants, contrôleurs). Il n&apos;a pas accès à vos revenus.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="co-organisateur@email.com"
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Ajout…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Ajouter
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Co-organisateurs ({collaborators.length})
        </div>
        {collaborators.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun co-organisateur pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {collaborators.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="truncate text-sm font-medium text-slate-800">
                    {c.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(c.id)}
                  disabled={pendingId === c.id}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label="Retirer le co-organisateur"
                >
                  {pendingId === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
