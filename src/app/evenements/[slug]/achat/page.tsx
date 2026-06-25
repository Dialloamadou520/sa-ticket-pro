import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  CalendarDays,
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
import { getEventBySlug } from "@/lib/data/events";
import { getServiceFeesEnabled } from "@/lib/data/settings";
import { resolveFeeMode } from "@/lib/payments/commission";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatDate, formatPrice, formatTime } from "@/lib/format";
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

  const feeMode = resolveFeeMode(event.fee_mode, await getServiceFeesEnabled());

  let isAuthenticated = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  }

  return (
    <div className="bg-slate-50">
      {/* Bandeau image de l'événement */}
      <div className="relative h-52 w-full bg-slate-900 sm:h-64">
        {event.banner_url && (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/30" />
        <Container className="relative flex h-full flex-col justify-end pb-6">
          <nav className="mb-3 flex items-center gap-1 text-sm text-white/70">
            <Link href="/explorer" className="hover:text-white">
              Explorer
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/evenements/${event.slug}`}
              className="max-w-[10rem] truncate hover:text-white sm:max-w-none"
            >
              {event.title}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Achat</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            {event.category && (
              <Badge tone="brand" className="bg-white/15 text-white backdrop-blur">
                {event.category.name}
              </Badge>
            )}
            <Badge tone="purple" className="bg-white/15 text-white backdrop-blur">
              {TICKET_TYPE_LABELS[event.ticket_type]}
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">
            {event.title}
          </h1>
        </Container>
      </div>

      <Container className="relative -mt-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/30">
                  <TicketIcon className="h-6 w-6" />
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

              {!isAuthenticated && (
                <p className="mt-5 flex flex-wrap items-center gap-1 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                  <span className="font-medium">Achat en tant qu&apos;invité</span>
                  — aucun compte requis. Déjà inscrit&nbsp;?
                  <Link
                    href={`/connexion?redirect=/evenements/${event.slug}/achat`}
                    className="font-semibold underline"
                  >
                    Connectez-vous
                  </Link>
                  .
                </p>
              )}

              <div className="mt-6">
                <PurchaseForm event={event} feeMode={feeMode} />
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <aside className="lg:col-span-2">
            <div className="sticky top-20 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
