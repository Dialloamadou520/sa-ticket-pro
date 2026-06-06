import Link from "next/link";
import { Container } from "@/components/ui/container";
import { DynamicIcon } from "@/components/ui/icon";
import type { Category } from "@/lib/types";

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-16">
      <Container>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Explorez par catégorie
          </h2>
          <p className="mt-2 text-slate-500">
            Trouvez l&apos;événement qui vous ressemble
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/explorer?category=${cat.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
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
