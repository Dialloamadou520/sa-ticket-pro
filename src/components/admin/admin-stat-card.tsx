import { type LucideIcon } from "lucide-react";

type Accent = "emerald" | "blue" | "violet" | "amber" | "rose";

const ACCENTS: Record<Accent, { tile: string; ring: string }> = {
  emerald: { tile: "bg-gradient-to-br from-emerald-500 to-emerald-600", ring: "ring-emerald-100" },
  blue: { tile: "bg-gradient-to-br from-sky-500 to-blue-600", ring: "ring-sky-100" },
  violet: { tile: "bg-gradient-to-br from-violet-500 to-purple-600", ring: "ring-violet-100" },
  amber: { tile: "bg-gradient-to-br from-amber-400 to-orange-500", ring: "ring-amber-100" },
  rose: { tile: "bg-gradient-to-br from-rose-500 to-pink-600", ring: "ring-rose-100" },
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "emerald",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: Accent;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ring-4 ${a.tile} ${a.ring}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
