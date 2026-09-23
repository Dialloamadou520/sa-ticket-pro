import { type LucideIcon } from "lucide-react";

type Accent = "emerald" | "blue" | "violet" | "amber" | "rose";

const ACCENTS: Record<Accent, { tile: string; ring: string }> = {
  emerald: {
    tile: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    ring: "ring-emerald-100",
  },
  blue: {
    tile: "bg-gradient-to-br from-sky-500 to-blue-600",
    ring: "ring-sky-100",
  },
  violet: {
    tile: "bg-gradient-to-br from-violet-500 to-purple-600",
    ring: "ring-violet-100",
  },
  amber: {
    tile: "bg-gradient-to-br from-amber-400 to-orange-500",
    ring: "ring-amber-100",
  },
  rose: {
    tile: "bg-gradient-to-br from-rose-500 to-pink-600",
    ring: "ring-rose-100",
  },
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
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 sm:text-sm">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ring-4 sm:h-10 sm:w-10 ${a.tile} ${a.ring}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
      <p className="mt-2 break-words text-lg font-bold tracking-tight text-slate-900 sm:mt-3 sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
