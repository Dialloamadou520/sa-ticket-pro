import { cn } from "@/lib/utils";

type Tone = "brand" | "slate" | "green" | "amber" | "red" | "purple";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  slate: "bg-slate-100 text-slate-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-purple-50 text-purple-700",
};

export function Badge({
  tone = "slate",
  className,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
