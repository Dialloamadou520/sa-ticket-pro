import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  active?: string;
  search?: string;
  city?: string;
}

export function EventFilters({ categories, active, search, city }: Props) {
  const buildHref = (slug?: string) => {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (search) params.set("search", search);
    if (city) params.set("city", city);
    const qs = params.toString();
    return `/explorer${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <form action="/explorer" method="get" className="flex flex-wrap gap-3">
        {active && <input type="hidden" name="category" value={active} />}
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Rechercher un événement..."
          className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <input
          type="text"
          name="city"
          defaultValue={city}
          placeholder="Ville"
          className="h-11 w-40 rounded-xl border border-slate-300 bg-white px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <button
          type="submit"
          className="h-11 rounded-xl bg-brand-600 px-6 text-sm font-medium text-white hover:bg-brand-700"
        >
          Filtrer
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref()}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            !active
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
          )}
        >
          Tout
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={buildHref(cat.slug)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === cat.slug
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
