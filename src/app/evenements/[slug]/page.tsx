import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  MapPin,
  Navigation,
  Share2,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { ExpandableText } from "@/components/events/expandable-text";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { getEventBySlug } from "@/lib/data/events";
import {
  displayFillPercent,
  formatDate,
  formatPrice,
  formatTime,
  isEventPast,
} from "@/lib/format";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import { getTierTheme } from "@/lib/tier-theme";
import { EventCountdown } from "@/components/events/event-countdown";
import { FillGauge } from "@/components/events/fill-gauge";

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
  const fillPercent = displayFillPercent(event);
  const place = [event.location, event.city].filter(Boolean).join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const pageUrl = host ? `${proto}://${host}/evenements/${event.slug}` : "";
  const shareText = [
    `${event.title} — ${formatDate(event.starts_at, "d MMMM")} à ${formatTime(event.starts_at)}, ${place}`,
    pageUrl,
  ]
    .filter(Boolean)
    .join("\n");

  const closedLabel = past
    ? "Événement terminé"
    : soldOut
      ? "Événement complet"
      : null;

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {event.banner_url && (
          <Image
            src={event.banner_url}
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover opacity-50 blur-2xl"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950" />

        <Container className="relative grid items-center gap-5 py-5 sm:gap-6 sm:py-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-12 lg:py-14">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[240px] overflow-hidden rounded-3xl sm:max-w-[320px] bg-slate-900 shadow-2xl ring-1 ring-white/15 lg:max-w-none">
            {event.banner_url ? (
              <Image
                src={event.banner_url}
                alt={event.title}
                fill
                preload
                sizes="(max-width: 640px) 240px, 380px"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                <TicketIcon className="h-16 w-16" />
              </div>
            )}
          </div>

          <div className="text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {event.category && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20 backdrop-blur">
                  {event.category.name}
                </span>
              )}
              <span className="rounded-full bg-brand-500/90 px-3 py-1 text-xs font-semibold">
                {TICKET_TYPE_LABELS[event.ticket_type]}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {event.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-slate-200 sm:mt-4 sm:gap-x-5 lg:justify-start">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-brand-300" />
                <span className="inline-block first-letter:uppercase">{formatDate(event.starts_at)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-300" />
                {formatTime(event.starts_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-300" />
                {place}
              </span>
            </div>
            <div className="mt-6 hidden lg:block">
              <p className="text-sm text-slate-300">À partir de</p>
              <p className="text-4xl font-extrabold">{formatPrice(event.price)}</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-5 py-6 pb-28 lg:grid-cols-3 lg:gap-8 lg:py-10 lg:pb-16">
        <div className="grid divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 sm:gap-3 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none lg:col-span-2">
          <InfoCard
            icon={<CalendarDays className="h-5 w-5" />}
            tone="bg-brand-50 text-brand-700"
            label="Date"
          >
            <span className="inline-block first-letter:uppercase">
              {formatDate(event.starts_at, "EEEE d MMMM")}
            </span>
          </InfoCard>
          <InfoCard
            icon={<Clock className="h-5 w-5" />}
            tone="bg-amber-50 text-amber-700"
            label="Horaire"
          >
            {formatTime(event.starts_at)}
            {event.ends_at ? ` – ${formatTime(event.ends_at)}` : ""}
          </InfoCard>
          <InfoCard
            icon={<MapPin className="h-5 w-5" />}
            tone="bg-rose-50 text-rose-700"
            label="Lieu"
          >
            {event.location}
            {event.city && (
              <span className="block text-xs font-normal text-slate-500">
                {event.city}
              </span>
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              <Navigation className="h-3.5 w-3.5" />
              Itinéraire
            </a>
          </InfoCard>
          <InfoCard
            icon={<Users className="h-5 w-5" />}
            tone="bg-purple-50 text-purple-700"
            label="Capacité"
          >
            {event.capacity.toLocaleString("fr-FR")} places
          </InfoCard>
        </div>

        <aside className="lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <div className="space-y-4 lg:sticky lg:top-20">
            <EventCountdown startsAt={event.starts_at} endsAt={event.ends_at} />
            <div
              id="billets"
              className="scroll-mt-20 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">À partir de</p>
                  <p className="mt-0.5 text-3xl font-extrabold text-brand-700">
                    {formatPrice(event.price)}
                  </p>
                </div>
                <Badge tone="brand">
                  <TicketIcon className="h-3.5 w-3.5" />
                  Billets
                </Badge>
              </div>

              {event.tiers && event.tiers.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {event.tiers.map((t) => {
                    const tt = getTierTheme(t.name);
                    return (
                      <li
                        key={t.id}
                        className="flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 py-2.5 pl-0 pr-3"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={`h-9 w-1.5 shrink-0 rounded-r-full bg-gradient-to-b ${tt.gradient}`}
                          />
                          <span className="truncate font-semibold capitalize text-slate-800">
                            {t.name}
                          </span>
                        </span>
                        <span className={`shrink-0 font-bold ${tt.text}`}>
                          {t.price > 0 ? formatPrice(t.price) : "Gratuit"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {fillPercent !== null && (
                <FillGauge percent={fillPercent} soldOut={soldOut} />
              )}

              {closedLabel ? (
                <button
                  disabled
                  className="mt-5 w-full cursor-not-allowed rounded-xl bg-slate-200 py-3 font-medium text-slate-500"
                >
                  {closedLabel}
                </button>
              ) : (
                <LinkButton
                  href={`/evenements/${event.slug}/achat`}
                  size="lg"
                  className="mt-5 w-full"
                >
                  <TicketIcon className="h-5 w-5" />
                  Acheter un ticket
                </LinkButton>
              )}

              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4" />
                Partager sur WhatsApp
              </a>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">
            À propos de l&apos;événement
          </h2>
          <div className="mt-3">
            <ExpandableText
              text={event.description || "Aucune description fournie."}
              className="leading-relaxed text-slate-600"
            />
          </div>
        </section>
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-500">À partir de</p>
            <p className="truncate text-lg font-extrabold text-brand-700">
              {formatPrice(event.price)}
            </p>
          </div>
          {closedLabel ? (
            <span className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-medium text-slate-500">
              {closedLabel}
            </span>
          ) : (
            <LinkButton href={`/evenements/${event.slug}/achat`} size="lg">
              <TicketIcon className="h-5 w-5" />
              Acheter
            </LinkButton>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  tone,
  label,
  children,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:block sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-4 sm:shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:mt-3">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-semibold text-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
}
