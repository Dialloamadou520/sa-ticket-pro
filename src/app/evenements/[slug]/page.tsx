import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  MapPin,
  Share2,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { getEventBySlug } from "@/lib/data/events";
import { formatDate, formatPrice, formatTime, isEventPast } from "@/lib/format";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import { getTierTheme } from "@/lib/tier-theme";
import { EventCountdown } from "@/components/events/event-countdown";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Événement introuvable" };
  return {
    title: event.title,
    description: event.description ?? undefined,
    openGraph: {
      title: event.title,
      description: event.description ?? undefined,
      images: event.banner_url ? [event.banner_url] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  // Le nombre de tickets vendus/restants reste réservé à l'organisateur et à
  // l'admin : côté acheteur on n'expose que l'état « complet ».
  const soldOut = event.tickets_sold >= event.capacity;
  const past = isEventPast(event);

  return (
    <div>
      <div className="relative h-72 w-full bg-slate-900 sm:h-96">
        {event.banner_url && (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
      </div>

      <Container className="-mt-24 relative pb-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {event.category && <Badge tone="brand">{event.category.name}</Badge>}
                <Badge tone="purple">
                  {TICKET_TYPE_LABELS[event.ticket_type]}
                </Badge>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
                {event.title}
              </h1>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoRow icon={<CalendarDays className="h-5 w-5" />} label="Date">
                  {formatDate(event.starts_at)}
                </InfoRow>
                <InfoRow icon={<Clock className="h-5 w-5" />} label="Heure">
                  {formatTime(event.starts_at)}
                </InfoRow>
                <InfoRow icon={<MapPin className="h-5 w-5" />} label="Lieu">
                  {event.location}
                  {event.city ? `, ${event.city}` : ""}
                </InfoRow>
                <InfoRow icon={<Users className="h-5 w-5" />} label="Capacité">
                  {event.capacity.toLocaleString("fr-FR")} places
                </InfoRow>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  À propos de l&apos;événement
                </h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
                  {event.description || "Aucune description fournie."}
                </p>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
            <EventCountdown startsAt={event.starts_at} endsAt={event.ends_at} />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">À partir de</p>
              <p className="mt-1 text-3xl font-bold text-brand-700">
                {formatPrice(event.price)}
              </p>

              {event.tiers && event.tiers.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  {event.tiers.map((t) => {
                    const tt = getTierTheme(t.name);
                    return (
                      <li key={t.id} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-600">
                          <span className={`h-2.5 w-2.5 rounded-full ${tt.dot}`} />
                          {t.name}
                        </span>
                        <span className="font-medium text-slate-900">
                          {t.price > 0 ? formatPrice(t.price) : "Gratuit"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {past ? (
                <button
                  disabled
                  className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-200 py-3 font-medium text-slate-500"
                >
                  Événement terminé
                </button>
              ) : soldOut ? (
                <button
                  disabled
                  className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-200 py-3 font-medium text-slate-500"
                >
                  Événement complet
                </button>
              ) : (
                <LinkButton
                  href={`/evenements/${event.slug}/achat`}
                  size="lg"
                  className="mt-6 w-full"
                >
                  <TicketIcon className="h-5 w-5" />
                  Acheter un ticket
                </LinkButton>
              )}

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Découvre cet événement: ${event.title}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </a>
            </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-brand-600">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="font-medium text-slate-800">{children}</p>
      </div>
    </div>
  );
}
