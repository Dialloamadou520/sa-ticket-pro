import Link from "next/link";
import { ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SearchBar } from "@/components/events/search-bar";
import { ProviderLogo } from "@/components/payments/provider-logo";
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel";
import {
  countdownLabel,
  formatDateShort,
  formatPrice,
  formatTime,
} from "@/lib/format";
import type { Event } from "@/lib/types";

/** Petit drapeau du Sénégal en CSS (les emojis drapeaux ne s'affichent pas partout). */
export function SenegalFlag() {
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

export function PaymentTrust() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-200 sm:text-sm">
      <span className="inline-flex items-center gap-2">
        <span className="flex -space-x-1.5">
          <ProviderLogo provider="wave" size={22} className="ring-2 ring-slate-900" />
          <ProviderLogo
            provider="orange_money"
            size={22}
            className="ring-2 ring-slate-900"
          />
        </span>
        Payez avec Wave ou Orange Money
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-brand-300" />
        QR code envoyé instantanément
      </span>
    </div>
  );
}

function startingPrice(event: Event): number {
  const prices = (event.tiers ?? []).map((t) => t.price);
  return prices.length > 0 ? Math.min(...prices) : event.price;
}

function toSlide(event: Event): HeroSlide {
  return {
    id: event.id,
    href: `/evenements/${event.slug}`,
    title: event.title,
    image: event.banner_url,
    category: event.category?.name ?? null,
    countdown: countdownLabel(event),
    date: `${formatDateShort(event.starts_at)} · ${formatTime(event.starts_at)}`,
    place: `${event.location}${event.city ? `, ${event.city}` : ""}`,
    price: formatPrice(startingPrice(event)),
  };
}

function StaticHero() {
  return (
    <section className="gradient-hero relative overflow-hidden text-white">
      <Container className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-brand-100 backdrop-blur">
            <SenegalFlag />
            La billetterie nouvelle génération en Afrique
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Vendez et achetez vos tickets,{" "}
            <span className="bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text text-transparent">
              en toute simplicité.
            </span>
          </h1>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/explorer"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-slate-900"
            >
              Explorer les événements
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/evenements/nouveau"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 px-6 font-semibold text-white hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Créer un événement
            </Link>
          </div>
          <div className="mt-8 flex justify-center">
            <PaymentTrust />
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Hero({ events }: { events: Event[] }) {
  const slides = events.filter((e) => e.banner_url).map(toSlide);
  if (slides.length === 0) return <StaticHero />;
  return (
    <HeroCarousel
      slides={slides}
      flag={<SenegalFlag />}
      trust={<PaymentTrust />}
      search={<SearchBar className="shadow-2xl shadow-black/40" />}
    />
  );
}
