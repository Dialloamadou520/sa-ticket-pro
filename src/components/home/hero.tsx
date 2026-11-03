import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  MapPin,
  Plus,
  QrCode,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { SearchBar } from "@/components/events/search-bar";
import { ProviderLogo } from "@/components/payments/provider-logo";
import { countdownLabel, formatDateShort, formatPrice } from "@/lib/format";
import type { Event } from "@/lib/types";

const stats = [
  { value: "500+", label: "Événements" },
  { value: "50 000+", label: "Tickets vendus" },
  { value: "120+", label: "Organisateurs" },
];

/** Petit drapeau du Sénégal en CSS (les emojis drapeaux ne s'affichent pas partout). */
function SenegalFlag() {
  return (
    <span
      aria-hidden
      className="relative inline-flex h-3 w-[18px] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/30"
    >
      <span className="flex-1 bg-[#00853f]" />
      <span className="flex flex-1 items-center justify-center bg-[#fdef42] text-[7px] leading-none text-[#00853f]">
        ★
      </span>
      <span className="flex-1 bg-[#e31b23]" />
    </span>
  );
}

function FeaturedTicket({ event }: { event: Event }) {
  const countdown = countdownLabel(event);
  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
      <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand-500/30 via-transparent to-accent-400/25 blur-2xl" />

      <Link
        href={`/evenements/${event.slug}`}
        className="group relative block rotate-[-2deg] overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl shadow-black/40 ring-1 ring-white/10 transition-transform duration-300 hover:rotate-0 hover:scale-[1.01]"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-800">
          {event.banner_url && (
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              priority
              sizes="(max-width: 1024px) 384px, 448px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
          <div className="absolute left-3 top-3 flex gap-2">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
              À la une
            </span>
            {countdown !== "Terminé" && (
              <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                {countdown}
              </span>
            )}
          </div>
          <div className="absolute inset-x-4 bottom-3 text-white">
            {event.category && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-200">
                {event.category.name}
              </p>
            )}
            <p className="line-clamp-2 text-lg font-bold leading-snug sm:text-xl">
              {event.title}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 px-4 pb-3 pt-3 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-brand-600" />
            {formatDateShort(event.starts_at)}
          </p>
          <p className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="truncate">
              {event.location}
              {event.city ? `, ${event.city}` : ""}
            </span>
          </p>
        </div>

        <div className="relative flex items-center px-4">
          <span className="absolute -left-3 h-6 w-6 rounded-full bg-[#0b3b2e]" />
          <span className="w-full border-t-2 border-dashed border-slate-200" />
          <span className="absolute -right-3 h-6 w-6 rounded-full bg-[#0b3b2e]" />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              À partir de
            </p>
            <p className="text-xl font-extrabold text-slate-900">
              {formatPrice(event.price)}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              Réserver
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white ring-4 ring-slate-100">
            <QrCode className="h-14 w-14" strokeWidth={1.5} />
          </span>
        </div>
      </Link>

      <div className="animate-float absolute -left-3 top-[20%] hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xl sm:flex lg:-left-10">
        <ProviderLogo provider="wave" size={26} />
        <span>
          Paiement reçu
          <span className="block text-[11px] font-medium text-emerald-600">
            Ticket envoyé ✓
          </span>
        </span>
      </div>
      <div className="animate-float-delayed absolute -right-2 -top-4 flex items-center gap-2 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-xl lg:-right-8">
        <ScanLine className="h-4 w-4" />
        Entrée validée
      </div>
    </div>
  );
}

export function Hero({ featured }: { featured?: Event | null }) {
  return (
    <section className="gradient-hero relative overflow-hidden text-white">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-500/15 blur-3xl" />

      <Container className="relative pb-12 pt-10 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20">
        <div
          className={`grid items-center gap-12 ${
            featured ? "lg:grid-cols-[1.15fr_0.85fr] lg:gap-10" : ""
          }`}
        >
          <div
            className={`animate-fade-up ${
              featured ? "" : "mx-auto max-w-3xl text-center"
            }`}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-brand-100 backdrop-blur">
              <SenegalFlag />
              La billetterie nouvelle génération en Afrique
            </span>

            <h1 className="mt-5 text-[2.25rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Vendez et achetez vos tickets,{" "}
              <span className="bg-gradient-to-r from-brand-300 via-emerald-200 to-accent-400 bg-clip-text text-transparent">
                en toute simplicité.
              </span>
            </h1>

            <p
              className={`mt-5 max-w-xl text-base text-slate-300 sm:text-lg ${
                featured ? "" : "mx-auto"
              }`}
            >
              Concerts, matchs, conférences, soirées… Réservez en quelques
              secondes, payez avec Wave ou Orange Money et recevez votre QR
              code instantanément.
            </p>

            <div className={`mt-7 max-w-xl ${featured ? "" : "mx-auto"}`}>
              <SearchBar className="shadow-2xl shadow-black/30 ring-1 ring-white/10" />
            </div>

            <div
              className={`mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap ${
                featured ? "" : "sm:justify-center"
              }`}
            >
              <Link
                href="/explorer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-400 to-accent-500 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-accent-500/20 transition-transform hover:scale-[1.02] sm:px-6 sm:text-base"
              >
                Explorer
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/evenements/nouveau"
                className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 sm:px-6 sm:text-base"
              >
                <Plus className="hidden h-4 w-4 sm:block" />
                Créer un événement
              </Link>
            </div>

            <div
              className={`mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-300 sm:text-sm ${
                featured ? "" : "justify-center"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="flex -space-x-1.5">
                  <ProviderLogo
                    provider="wave"
                    size={24}
                    className="ring-2 ring-[#0b3b2e]"
                  />
                  <ProviderLogo
                    provider="orange_money"
                    size={24}
                    className="ring-2 ring-[#0b3b2e]"
                  />
                </span>
                Wave & Orange Money
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand-300" />
                QR codes sécurisés
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-brand-300" />
                Ticket envoyé instantanément
              </span>
            </div>
          </div>

          {featured && (
            <div className="animate-fade-up [animation-delay:150ms]">
              <FeaturedTicket event={featured} />
            </div>
          )}
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/5 py-4 backdrop-blur sm:mt-16">
          {stats.map((s) => (
            <div key={s.label} className="px-2 text-center">
              <p className="text-xl font-extrabold sm:text-3xl">{s.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-300 sm:text-sm">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
