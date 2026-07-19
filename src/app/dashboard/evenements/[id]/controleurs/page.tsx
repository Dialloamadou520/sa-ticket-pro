import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EventControllers } from "@/components/dashboard/event-controllers";
import { getManageableEventById } from "@/lib/data/dashboard";
import { getEventControllers } from "@/lib/data/controllers";

export const metadata: Metadata = { title: "Contrôleurs" };

export default async function ControleursPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manageable = await getManageableEventById(id);
  if (!manageable) notFound();
  const { event } = manageable;

  const controllers = await getEventControllers(id);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/dashboard/evenements" className="hover:text-brand-600">
          Mes événements
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-700">Contrôleurs</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
        <p className="text-sm text-slate-500">
          Ajoutez des contrôleurs autorisés à scanner les tickets de cet
          événement. Ils n&apos;ont accès qu&apos;au scanner — aucune gestion ni
          revenu.
        </p>
      </div>

      <EventControllers eventId={id} controllers={controllers} />
    </div>
  );
}
