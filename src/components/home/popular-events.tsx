import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EventCard } from "@/components/events/event-card";
import type { Event } from "@/lib/types";

export function PopularEvents({ events }: { events: Event[] }) {
  if (events.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16">
      <Container>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Événements populaires
          </h2>
          <p className="mt-2 text-slate-500">
            Les rendez-vous à ne pas manquer
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/explorer"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
