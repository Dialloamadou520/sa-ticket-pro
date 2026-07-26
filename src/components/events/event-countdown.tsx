"use client";

import { useSyncExternalStore } from "react";
import { Timer } from "lucide-react";
import { eventEndsAt } from "@/lib/format";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diffParts(target: number, now: number): Parts | null {
  let delta = Math.floor((target - now) / 1000);
  if (delta <= 0) return null;
  const days = Math.floor(delta / 86_400);
  delta -= days * 86_400;
  const hours = Math.floor(delta / 3_600);
  delta -= hours * 3_600;
  const minutes = Math.floor(delta / 60);
  const seconds = delta - minutes * 60;
  return { days, hours, minutes, seconds };
}

const pad = (n: number) => n.toString().padStart(2, "0");

/** Horloge partagée : se met à jour chaque seconde, snapshot figé à la seconde. */
function useNow(): number | null {
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, 1000);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / 1000) * 1000,
    () => null,
  );
}

/** Compte à rebours dynamique (jours / heures / minutes / secondes) jusqu'au début de l'événement. */
export function EventCountdown({
  startsAt,
  endsAt,
}: {
  startsAt: string;
  endsAt: string | null;
}) {
  const target = new Date(startsAt).getTime();
  const end = eventEndsAt({ starts_at: startsAt, ends_at: endsAt }).getTime();
  const now = useNow();

  // Pendant le rendu serveur / avant hydratation, on n'affiche rien (évite les écarts d'hydratation).
  if (now === null) return null;

  const parts = diffParts(target, now);

  if (!parts) {
    if (now <= end) {
      return (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
          </span>
          Événement en cours — billetterie ouverte
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
        <Timer className="h-4 w-4" />
        Événement terminé
      </div>
    );
  }

  const items = [
    { value: parts.days, label: "j" },
    { value: parts.hours, label: "h" },
    { value: parts.minutes, label: "min" },
    { value: parts.seconds, label: "s" },
  ];

  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-brand-100/60 p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
        <Timer className="h-3.5 w-3.5" />
        Commence dans
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl bg-white/80 py-2 shadow-sm">
            <span className="block text-xl font-bold tabular-nums text-brand-700 sm:text-2xl">
              {it.label === "j" ? it.value : pad(it.value)}
            </span>
            <span className="text-[11px] font-medium text-slate-500">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
