import type { DailyViews } from "@/lib/data/analytics";

/**
 * Graphe à barres verticales des visites par jour (14 j), avec info-bulle au
 * survol, mise en évidence du pic et repère de moyenne. Présentation pure
 * (rendu serveur, sans JS).
 */
export function VisitsChart({ daily }: { daily: DailyViews[] }) {
  const max = Math.max(1, ...daily.map((d) => d.count));
  const total = daily.reduce((s, d) => s + d.count, 0);
  const avg = daily.length ? total / daily.length : 0;
  const avgPct = Math.round((avg / max) * 100);

  return (
    <div>
      <div className="relative h-44 pt-4">
        {/* Repère de moyenne */}
        {avg > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-brand-300"
            style={{ bottom: `${avgPct}%` }}
          >
            <span className="absolute -top-2.5 right-0 rounded bg-brand-50 px-1 text-[10px] font-medium text-brand-600">
              moy. {avg.toFixed(1)}
            </span>
          </div>
        )}

        <div className="flex h-full items-end gap-1">
          {daily.map((d) => {
            const h = Math.max(2, Math.round((d.count / max) * 100));
            const isPeak = d.count === max && d.count > 0;
            return (
              <div
                key={d.key}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                {/* Info-bulle */}
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden -translate-y-1 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
                  {d.count} visite{d.count > 1 ? "s" : ""}
                  <span className="ml-1 text-slate-300">· {d.label}</span>
                </div>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    isPeak
                      ? "bg-gradient-to-t from-brand-600 to-brand-400"
                      : "bg-gradient-to-t from-brand-400/80 to-brand-300/70 group-hover:from-brand-500 group-hover:to-brand-400"
                  }`}
                  style={{ height: `${h}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Axe des dates (un jour sur deux pour éviter l'encombrement) */}
      <div className="mt-2 flex gap-1">
        {daily.map((d, i) => (
          <span
            key={d.key}
            className="flex-1 truncate text-center text-[10px] text-slate-400"
          >
            {i % 2 === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
