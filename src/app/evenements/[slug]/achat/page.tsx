import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CalendarDays, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PurchaseForm } from "@/components/events/purchase-form";
import { getEventBySlug } from "@/lib/data/events";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Achat de ticket" };

export default async function AchatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  return (
    <Container className="py-10">
      <nav className="mb-6 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/explorer" className="hover:text-brand-600">
          Explorer
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/evenements/${event.slug}`} className="hover:text-brand-600">
          {event.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-700">Achat</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Réserver vos tickets
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Remplissez les informations ci-dessous pour finaliser votre achat.
            </p>
            <div className="mt-6">
              <PurchaseForm event={event} />
            </div>
          </div>
        </div>

        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="font-semibold text-slate-900">Récapitulatif</h2>
            <p className="mt-3 font-medium text-slate-800">{event.title}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-500">
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(event.starts_at)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.location}
                {event.city ? `, ${event.city}` : ""}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
              <span className="text-slate-600">Prix unitaire</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(event.price)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
