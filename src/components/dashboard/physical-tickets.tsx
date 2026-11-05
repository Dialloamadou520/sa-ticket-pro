"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban, FileDown, Loader2, Palette, Printer, QrCode, Sheet, Trash2 } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  cancelPhysicalBatch,
  createPhysicalBatch,
  deletePhysicalBatch,
  getPhysicalBatchTickets,
  type PhysicalBatchFormState,
} from "@/app/dashboard/actions";
import { TicketDesigner } from "@/components/dashboard/ticket-designer";
import {
  buildCustomDesignSheet,
  buildPrintCsv,
  buildPrintSheet,
  ticketNumber,
  type CustomTicketDesign,
  type PrintFormat,
  type PrintSheetEvent,
} from "@/lib/tickets/print-sheet";

export interface PhysicalBatchRow {
  id: string;
  label: string | null;
  category: string;
  price: string;
  color: [number, number, number];
  quantity: number;
  firstNumber: number;
  lastNumber: number;
  scanned: number;
  cancelled: number;
  date: string;
}

export interface PhysicalCategoryOption {
  value: string;
  label: string;
}

interface Props {
  eventId: string;
  eventSlug: string;
  event: { title: string; date: string; location: string };
  categories: PhysicalCategoryOption[];
  batches: PhysicalBatchRow[];
  ready: boolean;
  closed: boolean;
}

type Busy = { batchId: string; kind: PrintFormat | "csv" | "cancel" | "delete" | "design"; done?: number } | null;

export function PhysicalTickets({ eventId, eventSlug, event, categories, batches, ready, closed }: Props) {
  const action = createPhysicalBatch.bind(null, eventId);
  const [state, formAction, pending] = useActionState<PhysicalBatchFormState, FormData>(
    action,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [category, setCategory] = useState(categories[0]?.value ?? "new");
  const [designFor, setDesignFor] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  async function loadTickets(batch: PhysicalBatchRow) {
    const res = await getPhysicalBatchTickets(eventId, batch.id);
    if (res.error || !res.tickets) {
      toast.error(res.error ?? "Chargement impossible.");
      return null;
    }
    return res.tickets.filter((t) => t.status !== "cancelled" && t.status !== "refunded");
  }

  function sheetEvent(batch: PhysicalBatchRow): PrintSheetEvent {
    return { ...event, category: batch.category, price: batch.price, color: batch.color };
  }

  function fileBase(batch: PhysicalBatchRow) {
    return `billets-${eventSlug}-${ticketNumber(batch.firstNumber)}-${ticketNumber(batch.lastNumber)}`;
  }

  async function downloadPdf(batch: PhysicalBatchRow, format: PrintFormat) {
    setBusy({ batchId: batch.id, kind: format, done: 0 });
    try {
      const tickets = await loadTickets(batch);
      if (!tickets) return;
      if (tickets.length === 0) {
        toast.error("Aucun billet valide dans ce lot.");
        return;
      }
      const doc = await buildPrintSheet(format, sheetEvent(batch), tickets, (done) =>
        setBusy({ batchId: batch.id, kind: format, done })
      );
      doc.save(`${fileBase(batch)}${format === "labels" ? "-qr" : ""}.pdf`);
    } finally {
      setBusy(null);
    }
  }

  async function downloadDesignPdf(batch: PhysicalBatchRow, design: CustomTicketDesign) {
    setBusy({ batchId: batch.id, kind: "design", done: 0 });
    try {
      const tickets = await loadTickets(batch);
      if (!tickets) return;
      if (tickets.length === 0) {
        toast.error("Aucun billet valide dans ce lot.");
        return;
      }
      const doc = await buildCustomDesignSheet(design, tickets, (done) =>
        setBusy({ batchId: batch.id, kind: "design", done })
      );
      doc.save(`${fileBase(batch)}-design.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de générer le PDF.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadCsv(batch: PhysicalBatchRow) {
    setBusy({ batchId: batch.id, kind: "csv" });
    try {
      const tickets = await loadTickets(batch);
      if (!tickets) return;
      const csv = buildPrintCsv(sheetEvent(batch), tickets);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase(batch)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  function onCancel(batch: PhysicalBatchRow) {
    if (
      !window.confirm(
        `Annuler le lot N° ${ticketNumber(batch.firstNumber)} à ${ticketNumber(batch.lastNumber)} ? Les billets non encore entrés seront refusés au scanner.`
      )
    )
      return;
    setBusy({ batchId: batch.id, kind: "cancel" });
    startTransition(async () => {
      await cancelPhysicalBatch(eventId, batch.id);
      toast.success("Lot annulé.");
      setBusy(null);
    });
  }

  function onDelete(batch: PhysicalBatchRow) {
    if (
      !window.confirm(
        `Supprimer définitivement le lot N° ${ticketNumber(batch.firstNumber)} à ${ticketNumber(batch.lastNumber)} ?\n\nSes ${batch.quantity} QR codes seront effacés : s'ils sont déjà imprimés, ils seront refusés au scanner. Cette action est irréversible.`
      )
    )
      return;
    setBusy({ batchId: batch.id, kind: "delete" });
    startTransition(async () => {
      const res = await deletePhysicalBatch(eventId, batch.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Lot supprimé. Vous pouvez en générer un nouveau.");
        if (designFor === batch.id) setDesignFor(null);
      }
      setBusy(null);
    });
  }

  const btn =
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="space-y-6">
      {!ready && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Les billets physiques ne sont pas encore activés sur la base de données
          (migration 0022 à lancer).
        </div>
      )}

      {closed ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
          Cet événement est terminé : il n&apos;est plus possible de générer des billets.
        </p>
      ) : (
        <form
          ref={formRef}
          action={formAction}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Printer className="h-5 w-5 text-brand-600" /> Nouveau lot à imprimer
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Générez à l&apos;avance des QR codes numérotés pour vos tickets papier
              (guichet, points de vente). Chaque QR ne passe qu&apos;une fois au
              scanner. Les ventes papier ne sont pas comptées dans vos ventes en ligne.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="phys-category">Catégorie *</Label>
              <Select
                id="phys-category"
                name="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-base sm:text-sm"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
                <option value="new">+ Nouvelle catégorie papier…</option>
              </Select>
            </div>
            {category === "new" && (
              <div className="grid gap-4 rounded-xl border border-brand-100 bg-brand-50/40 p-3 sm:col-span-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phys-new-name">Nom de la catégorie *</Label>
                  <Input id="phys-new-name" name="new_name" required minLength={2} maxLength={40} placeholder="Ex. Tribune, Pelouse, VIP papier" className="text-base sm:text-sm" />
                </div>
                <div>
                  <Label htmlFor="phys-new-price">Prix imprimé (FCFA) *</Label>
                  <Input id="phys-new-price" name="new_price" type="number" inputMode="numeric" min={0} step={1} required defaultValue={0} className="text-base sm:text-sm" />
                </div>
                <p className="text-xs text-slate-500 sm:col-span-2">
                  Réservée aux billets papier : elle n&apos;apparaît pas à la vente en ligne
                  et sera proposée pour vos prochains lots.
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="phys-qty">Nombre de billets *</Label>
              <Input id="phys-qty" name="quantity" type="number" inputMode="numeric" min={1} max={1000} defaultValue={100} required className="text-base sm:text-sm" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="phys-label">Nom du lot</Label>
              <Input id="phys-label" name="label" maxLength={60} placeholder="Ex. Point de vente Sandaga" className="text-base sm:text-sm" />
            </div>
          </div>

          <Button type="submit" disabled={pending || !ready} className="w-full justify-center sm:w-auto">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Génération…
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" /> Générer les QR codes
              </>
            )}
          </Button>
        </form>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Lots générés ({batches.length})
        </div>
        {batches.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun lot pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {batches.map((b) => {
              const isBusy = busy?.batchId === b.id;
              const active = b.quantity - b.cancelled;
              return (
                <li key={b.id} className="space-y-3 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words text-slate-900">
                        N° {ticketNumber(b.firstNumber)} → {ticketNumber(b.lastNumber)}
                        {b.label && <span className="font-normal text-slate-500"> · {b.label}</span>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.category} · {b.price} · {b.quantity} billet{b.quantity > 1 ? "s" : ""} · {b.date}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {b.scanned}/{active} entrés
                    </span>
                  </div>
                  {b.cancelled > 0 && (
                    <p className="text-xs text-red-600">
                      {b.cancelled} billet{b.cancelled > 1 ? "s" : ""} annulé{b.cancelled > 1 ? "s" : ""}
                    </p>
                  )}
                  {isBusy && busy?.done !== undefined && busy.kind !== "design" && (
                    <p className="text-xs text-slate-500">
                      Préparation du PDF… {busy.done}/{active}
                    </p>
                  )}
                  {active > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      <button type="button" className={btn} disabled={!!busy} onClick={() => downloadPdf(b, "tickets")}>
                        {isBusy && busy?.kind === "tickets" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                        Billets (PDF)
                      </button>
                      <button type="button" className={btn} disabled={!!busy} onClick={() => downloadPdf(b, "labels")}>
                        {isBusy && busy?.kind === "labels" ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                        QR seuls (PDF)
                      </button>
                      <button
                        type="button"
                        className={`${btn} ${designFor === b.id ? "border-brand-400 bg-brand-50 text-brand-700" : ""}`}
                        disabled={!!busy}
                        onClick={() => setDesignFor(designFor === b.id ? null : b.id)}
                      >
                        <Palette className="h-4 w-4" />
                        Mon design (PDF)
                      </button>
                      <button type="button" className={btn} disabled={!!busy} onClick={() => downloadCsv(b)}>
                        {isBusy && busy?.kind === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sheet className="h-4 w-4" />}
                        CSV imprimeur
                      </button>
                      {active > b.scanned && (
                        <button
                          type="button"
                          className={`${btn} border-red-200 text-red-600 hover:bg-red-50`}
                          disabled={!!busy}
                          onClick={() => onCancel(b)}
                        >
                          {isBusy && busy?.kind === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                          Annuler le lot
                        </button>
                      )}
                    </div>
                  )}
                  {b.scanned === 0 && (
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      disabled={!!busy}
                      onClick={() => onDelete(b)}
                    >
                      {isBusy && busy?.kind === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Supprimer définitivement
                    </button>
                  )}
                  {active > 0 && designFor === b.id && (
                    <TicketDesigner
                      eventId={eventId}
                      busy={isBusy && busy?.kind === "design"}
                      progress={
                        isBusy && busy?.kind === "design"
                          ? `Préparation… ${busy.done ?? 0}/${active}`
                          : undefined
                      }
                      onGenerate={(design) => downloadDesignPdf(b, design)}
                      onClose={() => setDesignFor(null)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-500">
        <strong>Billets (PDF)</strong> : tickets complets prêts à découper (10 par page A4).{" "}
        <strong>QR seuls (PDF)</strong> : planche d&apos;étiquettes (24 par page) à coller ou
        à imprimer sur vos propres tickets. <strong>CSV imprimeur</strong> : numéros et
        contenus des QR pour une impression professionnelle.{" "}
        <strong>Mon design (PDF)</strong> : importez votre propre visuel de billet et
        placez-y le QR code ; il est ajouté automatiquement à chaque billet du lot.{" "}
        <strong>Supprimer définitivement</strong> : efface un lot dont aucun billet n&apos;est
        encore entré, pour le refaire ; la numérotation reprend après le dernier lot restant.
      </p>
    </div>
  );
}
