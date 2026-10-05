"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { DailySales } from "@/lib/data/dashboard";

const RANGES = [
  { key: "7", label: "7 j", days: 7 },
  { key: "30", label: "30 j", days: 30 },
  { key: "all", label: "Tout", days: Infinity },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

/**
 * Billets vendus par jour pour un événement : période réglable, meilleur jour
 * mis en évidence, info-bulle (billets et, pour le propriétaire, revenus).
 */
export function SalesChart({
  daily,
  showRevenue,
}: {
  daily: DailySales[];
  showRevenue: boolean;
}) {
  const ranges = RANGES.filter((r) => r.days === Infinity || r.days < daily.length);
  const [range, setRange] = useState<RangeKey>(daily.length > 30 ? "30" : "all");
  const active = ranges.find((r) => r.key === range) ?? ranges[ranges.length - 1];

  const data = active.days === Infinity ? daily : daily.slice(-active.days);
  const total = data.reduce((s, d) => s + d.tickets, 0);
  const revenue = data.reduce((s, d) => s + d.revenue, 0);
  const max = Math.max(1, ...data.map((d) => d.tickets));
  const best = data.reduce<DailySales | null>(
    (b, d) => (d.tickets > (b?.tickets ?? 0) ? d : b),
    null
  );
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-2xl font-bold text-slate-900">
            {total.toLocaleString("fr-FR")}
            <span className="ml-1.5 text-xs font-medium text-slate-500">
              billet{total > 1 ? "s" : ""} vendu{total > 1 ? "s" : ""}
            </span>
          </span>
          {showRevenue && (
            <span className="text-sm font-semibold text-brand-700">
              {formatPrice(revenue)}
            </span>
          )}
          {best && (
            <span className="text-xs text-slate-500">
              Meilleur jour : {best.label} ({best.tickets})
            </span>
          )}
        </div>
        {ranges.length > 1 && (
          <div className="flex rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-colors sm:min-h-0 sm:py-1 ${
                  r.key === active.key
                    ? "bg-brand-600 text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex h-44 w-6 flex-col justify-between text-right text-[10px] text-slate-400">
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-44">
            {[0, 50, 100].map((p) => (
              <div
                key={p}
                className="pointer-events-none absolute inset-x-0 border-t border-slate-200/70"
                style={{ bottom: `${p}%` }}
              />
            ))}
            <div className="flex h-full items-end gap-[2px]">
              {data.map((d) => {
                const h = d.tickets > 0 ? Math.max(4, (d.tickets / max) * 100) : 1.5;
                const isBest = best?.key === d.key;
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
                      {d.tickets} billet{d.tickets > 1 ? "s" : ""}
                      {showRevenue && d.revenue > 0 && (
                        <span className="ml-1 text-slate-300">({formatPrice(d.revenue)})</span>
                      )}
                    </div>
                    <div
                      className={`w-full rounded-t-md ${
                        d.tickets === 0
                          ? "bg-slate-200"
                          : isBest
                            ? "bg-gradient-to-t from-brand-700 to-brand-400"
                            : "bg-gradient-to-t from-brand-400/80 to-brand-300/70 group-hover:from-brand-500 group-hover:to-brand-400"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex gap-[2px]">
            {data.map((d, i) => (
              <span
                key={d.key}
                className="flex-1 overflow-visible text-center text-[10px] whitespace-nowrap text-slate-400"
              >
                {i % labelEvery === 0 ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Barre foncée = meilleur jour · fond gris = week-end · touchez une barre
        pour le détail.
      </p>
    </div>
  );
}
