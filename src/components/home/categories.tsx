import Link from "next/link";
import { Container } from "@/components/ui/container";
import { DynamicIcon } from "@/components/ui/icon";
import type { Category } from "@/lib/types";

const palette = [
  "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
  "bg-amber-50 text-amber-600 group-hover:bg-amber-500",
  "bg-purple-50 text-purple-600 group-hover:bg-purple-600",
  "bg-sky-50 text-sky-600 group-hover:bg-sky-600",
  "bg-rose-50 text-rose-600 group-hover:bg-rose-600",
  "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600",
];

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-16">
      <Container>
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Catégories
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Explorez par catégorie
          </h2>
          <p className="mt-2 text-slate-500">
            Trouvez l&apos;événement qui vous ressemble
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/explorer?category=${cat.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors group-hover:text-white ${
                  palette[i % palette.length]
                }`}
              >
                <DynamicIcon name={cat.icon} className="h-5 w-5" />
              </span>
              <span className="font-medium text-slate-800">{cat.name}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
