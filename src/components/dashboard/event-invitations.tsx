"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban, Gift, Loader2, Phone, QrCode } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TicketView, type TicketViewData } from "@/components/tickets/ticket-view";
import {
  cancelInvitation,
  createInvitations,
  type InvitationFormState,
  type InvitationTicket,
} from "@/app/dashboard/actions";
import type { TicketStatus } from "@/lib/types";

export interface InvitationRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  ticketType: string;
  status: TicketStatus;
  qrToken: string;
  date: string;
}

interface Props {
  eventId: string;
  event: { title: string; date: string; location: string };
  tiers: { id: string; name: string }[];
  invitations: InvitationRow[];
  ready: boolean;
  closed: boolean;
}

const STATUS: Record<TicketStatus, { label: string; className: string }> = {
  valid: { label: "Valide", className: "bg-emerald-100 text-emerald-700" },
  used: { label: "Entré", className: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Annulée", className: "bg-red-100 text-red-700" },
  refunded: { label: "Annulée", className: "bg-red-100 text-red-700" },
};

export function EventInvitations({ eventId, event, tiers, invitations, ready, closed }: Props) {
  const action = createInvitations.bind(null, eventId);
  const [state, formAction, pending] = useActionState<InvitationFormState, FormData>(
    action,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.tickets?.length) {
      const n = state.tickets.length;
      toast.success(n > 1 ? `${n} invitations créées.` : "Invitation créée.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function view(t: Pick<InvitationTicket, "id" | "qrToken" | "holderName" | "ticketType">): TicketViewData {
    return {
      id: t.id,
      eventTitle: event.title,
      date: event.date,
      location: event.location,
      holderName: t.holderName,
      ticketType: t.ticketType,
      qrToken: t.qrToken,
    };
  }

  function onCancel(id: string) {
    if (!window.confirm("Annuler cette invitation ? Le billet sera refusé au scanner.")) return;
    setCancellingId(id);
    startTransition(async () => {
      await cancelInvitation(eventId, id);
      toast.success("Invitation annulée.");
      setCancellingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {!ready && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Les invitations ne sont pas encore activées sur la base de données
          (migration 0021 à lancer).
        </div>
      )}

      {closed ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
          Cet événement est terminé : il n&apos;est plus possible de créer des invitations.
        </p>
      ) : (
        <form
          ref={formRef}
          action={formAction}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Gift className="h-5 w-5 text-brand-600" /> Nouvelle invitation
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Billet gratuit pour un invité ou la presse, sans paiement. Il passe
              au scanner comme un billet acheté mais ne compte pas dans vos ventes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="inv-name">Nom de l&apos;invité *</Label>
              <Input id="inv-name" name="name" required maxLength={80} placeholder="Ex. Awa Ndiaye — Presse" className="text-base sm:text-sm" />
            </div>
            <div>
              <Label htmlFor="inv-phone">Téléphone</Label>
              <Input id="inv-phone" name="phone" type="tel" inputMode="tel" placeholder="77 123 45 67" className="text-base sm:text-sm" />
            </div>
            <div>
              <Label htmlFor="inv-email">Email</Label>
              <Input id="inv-email" name="email" type="email" placeholder="facultatif" className="text-base sm:text-sm" />
            </div>
            {tiers.length > 0 && (
              <div>
                <Label htmlFor="inv-tier">Catégorie *</Label>
                <Select id="inv-tier" name="tier_id" required defaultValue={tiers[0].id} className="text-base sm:text-sm">
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="inv-qty">Nombre de billets</Label>
              <Input id="inv-qty" name="quantity" type="number" min={1} max={20} defaultValue={1} required className="text-base sm:text-sm" />
            </div>
          </div>

          <Button type="submit" disabled={pending || !ready} className="w-full justify-center sm:w-auto">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Création…
              </>
            ) : (
              <>
                <Gift className="h-4 w-4" /> Générer l&apos;invitation
              </>
            )}
          </Button>
        </form>
      )}

      {state.tickets && state.tickets.length > 0 && (
        <section className="space-y-4">
          <p className="text-sm font-medium text-slate-700">
            Billet{state.tickets.length > 1 ? "s" : ""} prêt{state.tickets.length > 1 ? "s" : ""} :
            envoyez le QR, le PDF ou l&apos;image à l&apos;invité.
          </p>
          {state.tickets.map((t) => (
            <TicketView key={t.id} ticket={view(t)} />
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Invitations ({invitations.length})
        </div>
        {invitations.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucune invitation pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invitations.map((r) => {
              const badge = STATUS[r.status];
              const open = openId === r.id;
              return (
                <li key={r.id} className="space-y-3 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">
                        {r.ticketType} · {r.qrToken.slice(0, 8).toUpperCase()} · {r.date}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.phone && (
                      <a
                        href={`tel:${r.phone.replace(/\s/g, "")}`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 text-sm font-medium text-brand-700"
                      >
                        <Phone className="h-4 w-4" /> {r.phone}
                      </a>
                    )}
                    {r.status !== "cancelled" && r.status !== "refunded" && (
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : r.id)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <QrCode className="h-4 w-4" /> {open ? "Masquer le billet" : "Voir le billet"}
                      </button>
                    )}
                    {r.status === "valid" && (
                      <button
                        type="button"
                        onClick={() => onCancel(r.id)}
                        disabled={cancellingId === r.id}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancellingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                        Annuler
                      </button>
                    )}
                  </div>
                  {open && (
                    <TicketView
                      ticket={view({ id: r.id, qrToken: r.qrToken, holderName: r.name, ticketType: r.ticketType })}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
