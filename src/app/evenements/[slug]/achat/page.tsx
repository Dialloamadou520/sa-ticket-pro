import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarX,
  Clock,
  MapPin,
  ShieldCheck,
  Smartphone,
  QrCode,
  Ticket as TicketIcon,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { PurchaseForm } from "@/components/events/purchase-form";
import { ProviderLogo } from "@/components/payments/provider-logo";
import { getEventBySlug } from "@/lib/data/events";
import { getServiceFeePercent } from "@/lib/data/settings";
import { formatDate, formatPrice, formatTime, isEventPast } from "@/lib/format";
import { TICKET_TYPE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Achat de ticket" };

export default async function AchatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const feePercent = await getServiceFeePercent();
  const past = isEventPast(event);

  return (
    <div className="bg-slate-50">
      <div className="relative overflow-hidden bg-slate-950 text-white">
        {event.banner_url && (
          <Image
            src={event.banner_url}
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover opacity-40 blur-2xl"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 to-slate-950/90" />
        <Container className="relative py-4 sm:py-8">
          <nav className="hidden items-center gap-1 text-sm text-white/70 sm:flex">
            <Link href="/explorer" className="hover:text-white">
              Explorer
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/evenements/${event.slug}`}
              className="hover:text-white"
            >
              {event.title}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Achat</span>
          </nav>
          <Link
            href={`/evenements/${event.slug}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white sm:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour à l&apos;événement
          </Link>

          <div className="mt-3 flex items-center gap-4 sm:mt-5">
            <div className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-xl bg-slate-900 shadow-lg ring-1 ring-white/15 sm:h-32 sm:w-[102px]">
              {event.banner_url ? (
                <Image
                  src={event.banner_url}
                  alt={event.title}
                  fill
                  preload
                  sizes="102px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <TicketIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {event.category && (
                  <Badge tone="brand" className="bg-white/15 text-white backdrop-blur">
                    {event.category.name}
                  </Badge>
                )}
                <Badge tone="purple" className="bg-white/15 text-white backdrop-blur">
                  {TICKET_TYPE_LABELS[event.ticket_type]}
                </Badge>
              </div>
              <h1 className="mt-1.5 line-clamp-2 text-lg font-bold leading-tight sm:text-3xl">
                {event.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/75 sm:text-sm">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-300" />
                  {formatDate(event.starts_at, "d MMM yyyy")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-brand-300" />
                  {formatTime(event.starts_at)}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-300" />
                  <span className="truncate">
                    {[event.location, event.city].filter(Boolean).join(", ")}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="relative pb-16 pt-4 sm:pt-8">
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-3">
            {past ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <CalendarX className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  Événement terminé
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Cet événement est passé. La vente de tickets est clôturée.
                </p>
                <Link
                  href="/explorer"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Découvrir d&apos;autres événements
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/30 sm:h-11 sm:w-11">
                    <TicketIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Réserver vos tickets
                    </h2>
                    <p className="text-sm text-slate-500">
                      Quelques infos et c&apos;est réglé — votre billet s&apos;affiche aussitôt.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <PurchaseForm event={event} feePercent={feePercent} />
                </div>
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <aside className="lg:col-span-2">
            <div className="sticky top-20 space-y-4">
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Récapitulatif
                  </h2>
                </div>
                <div className="p-6">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <CalendarDays className="h-4 w-4" />
                      </span>
                      {formatDate(event.starts_at)}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Clock className="h-4 w-4" />
                      </span>
                      {formatTime(event.starts_at)}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span>
                        {event.location}
                        {event.city ? `, ${event.city}` : ""}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm text-slate-600">
                      {event.tiers && event.tiers.length > 0
                        ? "À partir de"
                        : "Prix unitaire"}
                    </span>
                    <span className="text-lg font-bold text-brand-700">
                      {formatPrice(event.price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Réassurance */}
              <ul className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                <Reassurance
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Paiement 100% sécurisé"
                >
                  Wave &amp; Orange Money, directement sur cette page.
                  <span className="mt-2 flex gap-2">
                    <ProviderLogo provider="wave" size={28} />
                    <ProviderLogo provider="orange_money" size={28} />
                  </span>
                </Reassurance>
                <Reassurance
                  icon={<QrCode className="h-4 w-4" />}
                  title="Billet immédiat"
                >
                  Votre QR code s&apos;affiche aussitôt et reste téléchargeable.
                </Reassurance>
                <Reassurance
                  icon={<Smartphone className="h-4 w-4" />}
                  title="Validez sur votre téléphone"
                >
                  Confirmez le paiement en un tap, sans quitter le site.
                </Reassurance>
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function Reassurance({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        {icon}
      </span>
      <div>
        <p className="font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{children}</p>
      </div>
    </li>
  );
}
