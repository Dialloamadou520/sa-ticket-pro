import { type LucideIcon } from "lucide-react";

const TONES = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  indigo: "bg-indigo-50 text-indigo-600",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 sm:text-sm">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${TONES[tone]}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
      <p className="mt-2 break-words text-lg font-bold text-slate-900 sm:mt-3 sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
