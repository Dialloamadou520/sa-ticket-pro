import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/dashboard/event-form";
import { updateEvent } from "@/app/dashboard/actions";
import { getCategories } from "@/lib/data/events";
import { getMyEvents } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Modifier l'événement" };

export default async function ModifierEvenementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categories, events] = await Promise.all([
    getCategories(),
    getMyEvents(),
  ]);
  const event = events.find((e) => e.id === id);
  if (!event) notFound();

  const action = updateEvent.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Modifier l&apos;événement</h1>
      <p className="mt-1 text-sm text-slate-500">{event.title}</p>
      <div className="mt-8">
        <EventForm
          action={action}
          categories={categories}
          event={event}
          submitLabel="Enregistrer les modifications"
        />
      </div>
    </div>
  );
}
