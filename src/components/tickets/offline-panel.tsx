"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CloudDownload,
  RefreshCw,
  Trash2,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/format";
import {
  clearConflicts,
  getQueue,
  installPack,
  packCounts,
  setPack,
  useOfflinePack,
  useScanQueue,
  useSyncConflicts,
} from "@/lib/tickets/offline-store";
import type { OfflinePack, ScannableEvent } from "@/lib/tickets/offline-types";

export function OfflinePanel({
  events,
  offlineMode,
  onOfflineModeChange,
  syncing,
  syncMessage,
  onSync,
}: {
  events: ScannableEvent[];
  offlineMode: boolean;
  onOfflineModeChange: (value: boolean) => void;
  syncing: boolean;
  syncMessage: string | null;
  onSync: () => void;
}) {
  const pack = useOfflinePack();
  const queue = useScanQueue();
  const conflicts = useSyncConflicts();
  const [selected, setSelected] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventId = selected || pack?.eventId || events[0]?.id || "";

  async function download() {
    if (!eventId) return;
    setError(null);
    const pending = getQueue().filter((s) => s.eventId !== eventId).length;
    if (pending > 0) {
      setError(
        `Envoyez d'abord les ${pending} entrée(s) en attente (bouton Synchroniser) avant de changer d'événement.`
      );
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch(`/api/tickets/offline?event=${eventId}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as OfflinePack & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Téléchargement impossible.");
        return;
      }
      if (!(await installPack(data))) {
        setError("Mémoire du navigateur pleine : impossible d'enregistrer la liste.");
      }
    } catch {
      setError("Pas de réseau : téléchargez la liste avant d'entrer dans la salle.");
    } finally {
      setDownloading(false);
    }
  }

  function remove() {
    if (!pack) return;
    if (queue.some((s) => s.eventId === pack.eventId)) {
      setError("Des entrées hors ligne ne sont pas encore envoyées : synchronisez d'abord.");
      return;
    }
    if (!window.confirm("Supprimer la liste des billets de ce téléphone ?")) return;
    onOfflineModeChange(false);
    setPack(null);
  }

  const counts = pack ? packCounts(pack) : null;
  const isUpdate = pack?.eventId === eventId;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <WifiOff className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">Mode hors connexion</p>
          <p className="text-xs text-slate-400">
            Téléchargez les billets avant l&apos;événement pour scanner sans réseau.
          </p>
        </div>
      </div>

      {pack && counts && (
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p className="truncate text-sm font-semibold text-slate-900">{pack.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {counts.total} billets · {counts.scanned} entrés · liste du{" "}
            {formatDate(pack.downloadedAt, "d MMM")} à {formatTime(pack.downloadedAt)}
          </p>
          <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200">
            <span>
              Scanner hors ligne
              <span className="block text-[11px] text-slate-400">
                À activer si le réseau est saturé dans la salle
              </span>
            </span>
            <input
              type="checkbox"
              checked={offlineMode}
              onChange={(e) => onOfflineModeChange(e.target.checked)}
              className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors before:block before:h-4 before:w-4 before:translate-x-0.5 before:rounded-full before:bg-white before:transition-transform checked:bg-amber-500 checked:before:translate-x-[1.125rem]"
            />
          </label>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              {queue.length > 0 ? (
                <span className="font-semibold text-amber-700">
                  {queue.length} entrée(s) à envoyer
                </span>
              ) : (
                "Toutes les entrées sont envoyées"
              )}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onSync}
              disabled={syncing || queue.length === 0}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              Synchroniser
            </Button>
          </div>
          {syncMessage && <p className="mt-1 text-xs text-slate-500">{syncMessage}</p>}
        </div>
      )}

      {events.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {(events.length > 1 || !pack) && (
            <select
              value={eventId}
              onChange={(e) => setSelected(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} — {formatDate(ev.starts_at, "d MMM")}
                </option>
              ))}
            </select>
          )}
          <Button onClick={download} disabled={downloading} className="sm:w-auto">
            <CloudDownload className="h-4 w-4" />
            {downloading
              ? "Téléchargement…"
              : isUpdate
                ? "Mettre à jour la liste"
                : "Télécharger les billets"}
          </Button>
        </div>
      ) : (
        !pack && (
          <p className="mt-3 text-xs text-slate-500">
            Aucun événement à venir à scanner avec ce compte.
          </p>
        )
      )}

      {error && (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {conflicts.length > 0 && (
        <div className="mt-3 rounded-2xl bg-orange-50 p-3 ring-1 ring-orange-200">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              {conflicts.length} doublon(s) / refus à la synchro
            </p>
            <button
              type="button"
              onClick={clearConflicts}
              className="text-xs font-medium text-orange-700 underline"
            >
              Effacer
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {conflicts.slice(0, 10).map((c) => (
              <li key={c.id} className="text-xs text-orange-900">
                <span className="font-semibold">{c.holder ?? "Billet"}</span> · scanné à{" "}
                {formatTime(c.scannedAt)} —{" "}
                {c.result === "already_used" && c.usedAt
                  ? `déjà entré à ${formatTime(c.usedAt)}${c.usedBy ? ` (${c.usedBy})` : ""}`
                  : c.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        Sans réseau, chaque téléphone ne voit que ses propres scans : un même billet
        présenté à deux entrées pourrait passer deux fois. Le doublon est signalé ici
        à la synchronisation.
      </p>

      {pack && (
        <button
          type="button"
          onClick={remove}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Supprimer la liste de ce téléphone
        </button>
      )}
    </div>
  );
}
