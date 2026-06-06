import type { Metadata } from "next";
import { EventForm } from "@/components/dashboard/event-form";
import { createEvent } from "@/app/dashboard/actions";
import { getCategories } from "@/lib/data/events";

export const metadata: Metadata = { title: "Créer un événement" };

export default async function NouveauEvenementPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Créer un événement</h1>
      <p className="mt-1 text-sm text-slate-500">
        Renseignez les informations de votre événement.
      </p>
      <div className="mt-8">
        <EventForm
          action={createEvent}
          categories={categories}
          submitLabel="Créer l'événement"
        />
      </div>
    </div>
  );
}
