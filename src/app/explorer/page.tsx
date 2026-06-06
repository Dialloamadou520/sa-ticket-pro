import type { Metadata } from "next";
import { CalendarSearch } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { getCategories, getPublishedEvents } from "@/lib/data/events";

export const metadata: Metadata = {
  title: "Explorer les événements",
  description:
    "Découvrez tous les événements à venir au Sénégal et en Afrique : concerts, festivals, sport, conférences et plus.",
};

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; city?: string }>;
}) {
  const params = await searchParams;
  const [categories, events] = await Promise.all([
    getCategories(),
    getPublishedEvents({
      category: params.category,
      search: params.search,
      city: params.city,
    }),
  ]);

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Explorer les événements
        </h1>
        <p className="mt-2 text-slate-500">
          {events.length} événement{events.length > 1 ? "s" : ""} disponible
          {events.length > 1 ? "s" : ""}
        </p>
      </div>

      <EventFilters
        categories={categories}
        active={params.category}
        search={params.search}
        city={params.city}
      />

      <div className="mt-8">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20 text-center">
            <CalendarSearch className="h-10 w-10 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">
              Aucun événement trouvé
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Essayez de modifier vos filtres de recherche.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
