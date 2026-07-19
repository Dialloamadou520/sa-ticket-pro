import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EventCollaborators } from "@/components/dashboard/event-collaborators";
import { getMyEvents } from "@/lib/data/dashboard";
import { getEventCollaborators } from "@/lib/data/collaborators";

export const metadata: Metadata = { title: "Co-organisateurs" };

export default async function CoOrganisateursPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Réservé au propriétaire : getMyEvents ne renvoie que ses propres événements.
  const events = await getMyEvents();
  const event = events.find((e) => e.id === id);
  if (!event) notFound();

  const collaborators = await getEventCollaborators(id);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/dashboard/evenements" className="hover:text-brand-600">
          Mes événements
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-700">Co-organisateurs</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
        <p className="text-sm text-slate-500">
          Ajoutez des co-organisateurs qui pourront gérer cet événement
          (modifier, participants, contrôleurs). Ils n&apos;ont pas accès à vos
          revenus et ne peuvent ni supprimer l&apos;événement ni gérer les
          co-organisateurs.
        </p>
      </div>

      <EventCollaborators eventId={id} collaborators={collaborators} />
    </div>
  );
}
