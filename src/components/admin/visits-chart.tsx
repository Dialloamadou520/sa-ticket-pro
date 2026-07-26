"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { DailyViews } from "@/lib/data/analytics";

const RANGES = [7, 14, 30] as const;
type Range = (typeof RANGES)[number];

const sum = (days: DailyViews[]) => days.reduce((s, d) => s + d.count, 0);

/**
 * Graphe des visites par jour : période réglable (7/14/30 j), grille de
 * repères, moyenne, mise en évidence du pic et du jour en cours, week-ends
 * grisés, info-bulle au survol et évolution vs période précédente.
 */
export function VisitsChart({ daily }: { daily: DailyViews[] }) {
  const [range, setRange] = useState<Range>(14);

  const data = daily.slice(-range);
  const previous = daily.slice(-2 * range, -range);
  const total = sum(data);
  const avg = data.length ? total / data.length : 0;
  const max = Math.max(1, ...data.map((d) => d.count));
  const peakKey = data.reduce(
    (best, d) => (d.count > best.count ? d : best),
    data[0] ?? { count: -1, key: "" },
  ).key;
  const todayKey = data[data.length - 1]?.key;

  const previousTotal = sum(previous);
  const trend =
    previous.length === range && previousTotal > 0
      ? Math.round(((total - previousTotal) / previousTotal) * 100)
      : null;

  // Une étiquette de date sur N pour éviter l'encombrement.
  const labelEvery = range <= 7 ? 1 : range <= 14 ? 2 : 5;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-2xl font-bold text-slate-900">
            {total.toLocaleString("fr-FR")}
            <span className="ml-1.5 text-xs font-medium text-slate-500">
              visites
            </span>
          </span>
          <span className="text-xs text-slate-500">
            {avg.toFixed(1)} / jour en moyenne
          </span>
          {trend !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                trend >= 0
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend > 0 ? "+" : ""}
              {trend} %
            </span>
          )}
        </div>

        <div className="flex rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                r === range
                  ? "bg-brand-600 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {r} j
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {/* Axe des ordonnées */}
        <div className="flex h-44 w-6 flex-col justify-between text-right text-[10px] text-slate-400">
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-44">
            {/* Grille */}
            {[0, 50, 100].map((p) => (
              <div
                key={p}
                className="pointer-events-none absolute inset-x-0 border-t border-slate-200/70"
                style={{ bottom: `${p}%` }}
              />
            ))}

            {/* Repère de moyenne */}
            {avg > 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-brand-400"
                style={{ bottom: `${(avg / max) * 100}%` }}
              >
                <span className="absolute -top-2.5 right-0 rounded bg-brand-50 px-1 text-[10px] font-medium text-brand-600">
                  moy. {avg.toFixed(1)}
                </span>
              </div>
            )}

            <div className="flex h-full items-end gap-[3px]">
              {data.map((d) => {
                const h = d.count > 0 ? Math.max(3, (d.count / max) * 100) : 2;
                const isPeak = d.key === peakKey && d.count > 0;
                const isToday = d.key === todayKey;
                return (
                  <div
                    key={d.key}
                    className={`group relative flex h-full flex-1 flex-col items-center justify-end rounded-sm ${
                      d.weekend ? "bg-slate-200/40" : ""
                    }`}
                  >
                    <div className="pointer-events-none absolute bottom-full z-20 mb-1 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
                      <span className="capitalize">{d.weekday}</span> {d.label}
                      <span className="mx-1 text-slate-500">·</span>
                      {d.count} visite{d.count > 1 ? "s" : ""}
                      {d.visitors > 0 && (
                        <span className="ml-1 text-slate-300">
                          ({d.visitors} visiteur{d.visitors > 1 ? "s" : ""})
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        d.count === 0
                          ? "bg-slate-200"
                          : isPeak
                            ? "bg-gradient-to-t from-brand-700 to-brand-400"
                            : "bg-gradient-to-t from-brand-400/80 to-brand-300/70 group-hover:from-brand-500 group-hover:to-brand-400"
                      } ${isToday ? "ring-2 ring-brand-500/40" : ""}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Axe des dates */}
          <div className="mt-2 flex gap-[3px]">
            {data.map((d, i) => (
              <span
                key={d.key}
                className={`flex-1 truncate text-center text-[10px] ${
                  d.key === todayKey
                    ? "font-semibold text-brand-700"
                    : "text-slate-400"
                }`}
              >
                {i % labelEvery === 0 || d.key === todayKey ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        Barre foncée = jour le plus fréquenté · fond gris = week-end · pointillés
        = moyenne de la période.
      </p>
    </div>
  );
}
