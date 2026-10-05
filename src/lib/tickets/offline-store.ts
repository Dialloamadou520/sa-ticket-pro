"use client";

import { useSyncExternalStore } from "react";
import type {
  OfflinePack,
  QueuedScan,
  SyncConflict,
  SyncResult,
} from "./offline-types";

const PACK_KEY = "kaypass-scan-pack";
const QUEUE_KEY = "kaypass-scan-queue";
const CONFLICTS_KEY = "kaypass-scan-conflicts";
const SYNC_BATCH = 200;
export const OFFLINE_SCANNER_LABEL = "Ce téléphone (hors ligne)";

const EMPTY_QUEUE: QueuedScan[] = [];
const EMPTY_CONFLICTS: SyncConflict[] = [];

let packCache: OfflinePack | null | undefined;
let queueCache: QueuedScan[] | undefined;
let conflictsCache: SyncConflict[] | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PACK_KEY) packCache = undefined;
    else if (e.key === QUEUE_KEY) queueCache = undefined;
    else if (e.key === CONFLICTS_KEY) conflictsCache = undefined;
    else return;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getPack(): OfflinePack | null {
  if (packCache === undefined) packCache = read<OfflinePack>(PACK_KEY);
  return packCache;
}

export function getQueue(): QueuedScan[] {
  if (queueCache === undefined) queueCache = read<QueuedScan[]>(QUEUE_KEY) ?? [];
  return queueCache;
}

export function getConflicts(): SyncConflict[] {
  if (conflictsCache === undefined) {
    conflictsCache = read<SyncConflict[]>(CONFLICTS_KEY) ?? [];
  }
  return conflictsCache;
}

/** Enregistre la liste ; `false` si la mémoire du navigateur est pleine. */
export function setPack(pack: OfflinePack | null): boolean {
  const ok = write(PACK_KEY, pack);
  if (ok) packCache = pack;
  emit();
  return ok;
}

function setQueue(queue: QueuedScan[]) {
  queueCache = queue;
  write(QUEUE_KEY, queue);
  emit();
}

function setConflicts(conflicts: SyncConflict[]) {
  conflictsCache = conflicts;
  write(CONFLICTS_KEY, conflicts.length ? conflicts : null);
  emit();
}

export function clearConflicts() {
  setConflicts([]);
}

export function useOfflinePack(): OfflinePack | null {
  return useSyncExternalStore(subscribe, getPack, () => null);
}

export function useScanQueue(): QueuedScan[] {
  return useSyncExternalStore(subscribe, getQueue, () => EMPTY_QUEUE);
}

export function useSyncConflicts(): SyncConflict[] {
  return useSyncExternalStore(subscribe, getConflicts, () => EMPTY_CONFLICTS);
}

export function normalizeToken(raw: string): string {
  const trimmed = raw.trim();
  const token = trimmed.includes("/verifier/")
    ? (trimmed.split("/verifier/").pop()?.split(/[?#]/)[0] ?? trimmed)
    : trimmed;
  return token.toLowerCase();
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Index du billet dans la liste : QR complet (hash) ou « Réf. » saisie. */
async function findTicket(pack: OfflinePack, token: string): Promise<number> {
  if (/^[0-9a-f]{6,8}$/.test(token)) {
    const matches = pack.tickets
      .map((t, i) => (t.ref.startsWith(token) ? i : -1))
      .filter((i) => i >= 0);
    return matches.length === 1 ? matches[0] : -1;
  }
  const hash = await sha256Hex(token);
  return pack.tickets.findIndex((t) => t.h === hash);
}

function markUsed(
  pack: OfflinePack,
  index: number,
  usedAt: string,
  usedBy: string | null
): OfflinePack {
  const tickets = pack.tickets.slice();
  tickets[index] = { ...tickets[index], used: true, usedAt, usedBy };
  return { ...pack, tickets };
}

export function packCounts(pack: OfflinePack) {
  const total = pack.tickets.length;
  const scanned = pack.tickets.filter((t) => t.used).length;
  return { total, scanned, remaining: total - scanned };
}

export interface OfflineVerdict {
  result: "valid" | "already_used" | "invalid";
  message: string;
  holder?: string | null;
  event: string;
  usedAt?: string | null;
  usedBy?: string | null;
}

/**
 * Vérifie un billet sur la liste téléchargée. Une entrée validée est marquée
 * utilisée localement et mise en file d'attente pour le serveur.
 */
export async function verifyOffline(raw: string): Promise<OfflineVerdict | null> {
  const pack = getPack();
  if (!pack) return null;
  const token = normalizeToken(raw);
  if (!token) return { result: "invalid", message: "Code vide.", event: pack.title };

  const index = await findTicket(pack, token);
  if (index < 0) {
    return {
      result: "invalid",
      message:
        "Billet absent de la liste téléchargée (autre événement, ou acheté après le téléchargement).",
      event: pack.title,
    };
  }

  const ticket = pack.tickets[index];
  if (ticket.used) {
    return {
      result: "already_used",
      message: "Ce ticket a déjà été utilisé.",
      holder: ticket.holder,
      event: pack.title,
      usedAt: ticket.usedAt,
      usedBy: ticket.usedBy,
    };
  }

  const now = new Date().toISOString();
  setPack(markUsed(pack, index, now, OFFLINE_SCANNER_LABEL));
  setQueue([
    ...getQueue(),
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      eventId: pack.eventId,
      token,
      holder: ticket.holder,
      scannedAt: now,
    },
  ]);
  return {
    result: "valid",
    message: "Entrée autorisée (hors ligne).",
    holder: ticket.holder,
    event: pack.title,
  };
}

/** Reporte sur la liste locale un scan validé en ligne. */
export async function recordOnlineScan(
  raw: string,
  usedAt: string | null | undefined,
  usedBy: string | null | undefined
) {
  const pack = getPack();
  if (!pack) return;
  const index = await findTicket(pack, normalizeToken(raw));
  if (index < 0 || pack.tickets[index].used) return;
  setPack(markUsed(pack, index, usedAt ?? new Date().toISOString(), usedBy ?? null));
}

/** Liste fraîche du serveur + entrées locales pas encore synchronisées. */
export async function installPack(pack: OfflinePack): Promise<boolean> {
  let next = pack;
  for (const scan of getQueue()) {
    if (scan.eventId !== pack.eventId) continue;
    const index = await findTicket(next, scan.token);
    if (index >= 0 && !next.tickets[index].used) {
      next = markUsed(next, index, scan.scannedAt, OFFLINE_SCANNER_LABEL);
    }
  }
  return setPack(next);
}

/**
 * Envoie les entrées hors ligne au serveur. Retourne le nombre de scans
 * confirmés et de doublons/refus détectés.
 */
export async function syncQueue(): Promise<{ synced: number; conflicts: number }> {
  const batch = getQueue().slice(0, SYNC_BATCH);
  if (batch.length === 0) return { synced: 0, conflicts: 0 };

  const res = await fetch("/api/tickets/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scans: batch.map(({ id, token, scannedAt }) => ({ id, token, scannedAt })),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`sync ${res.status}`);
  const { results } = (await res.json()) as { results: SyncResult[] };

  const byId = new Map(batch.map((s) => [s.id, s]));
  const done = new Set(results.map((r) => r.id));
  setQueue(getQueue().filter((s) => !done.has(s.id)));

  const conflicts: SyncConflict[] = results
    .filter((r) => r.result !== "valid")
    .map((r) => ({
      ...r,
      holder: r.holder ?? byId.get(r.id)?.holder ?? null,
      scannedAt: byId.get(r.id)?.scannedAt ?? new Date().toISOString(),
    }));
  if (conflicts.length) setConflicts([...conflicts, ...getConflicts()].slice(0, 50));

  return { synced: results.length - conflicts.length, conflicts: conflicts.length };
}
