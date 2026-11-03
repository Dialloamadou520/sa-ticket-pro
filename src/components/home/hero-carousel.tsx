"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Container } from "@/components/ui/container";

export interface HeroSlide {
  id: string;
  href: string;
  title: string;
  image: string | null;
  category: string | null;
  countdown: string;
  date: string;
  place: string;
  price: string;
}

const INTERVAL_MS = 6000;

/** Hero de l'accueil : carrousel plein écran des prochains événements. */
export function HeroCarousel({
  slides,
  flag,
  trust,
  search,
}: {
  slides: HeroSlide[];
  flag: ReactNode;
  trust: ReactNode;
  search: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count, go]);

  const slide = slides[index];
  const upNext = count > 1 ? [1, 2, 3].map((n) => slides[(index + n) % count]).slice(0, Math.min(3, count - 1)) : [];

  return (
    <section
      className="relative isolate overflow-hidden bg-slate-950 text-white"
      aria-roledescription="carrousel"
      aria-label="Prochains événements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="absolute inset-0 -z-10">
        {slides.map((s, i) => (
          <div
            key={s.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            {s.image && (
              <Image
                src={s.image}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className={`object-cover ${i === index ? "animate-ken-burns" : ""}`}
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent" />
      </div>

      <Container className="relative flex min-h-[620px] flex-col justify-end pb-8 pt-20 sm:min-h-[640px] lg:min-h-[680px] lg:pb-12">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <h1 className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
              {flag}
              Les prochains événements au Sénégal
            </h1>

            <div key={slide.id} className="animate-fade-up" aria-live="polite">
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {slide.category && (
                  <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    {slide.category}
                  </span>
                )}
                <span className="rounded-full bg-accent-400 px-3 py-1 text-xs font-bold text-slate-950">
                  {slide.countdown}
                </span>
              </div>
              <h2 className="mt-3 line-clamp-2 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
                {slide.title}
              </h2>
              <div className="mt-4 flex flex-col gap-1.5 text-sm text-slate-200 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:text-base">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-accent-400" />
                  {slide.date}
                </span>
                <span className="inline-flex min-w-0 items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-accent-400" />
                  <span className="truncate">{slide.place}</span>
                </span>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={slide.href}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-accent-400 to-accent-500 px-6 font-semibold text-slate-950 shadow-lg shadow-accent-500/25 transition-transform hover:scale-[1.02]"
                >
                  Réserver · {slide.price}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/explorer"
                  className="inline-flex min-h-12 items-center rounded-xl border border-white/25 bg-white/10 px-5 font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  Tous les événements
                </Link>
              </div>
            </div>

            {count > 1 && (
              <div className="mt-8 flex items-center gap-3">
                <div className="flex flex-1 gap-1.5 sm:max-w-xs">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => go(i)}
                      aria-label={`Afficher ${s.title}`}
                      aria-current={i === index}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25"
                    >
                      {i < index && <span className="block h-full w-full bg-white" />}
                      {i === index && (
                        <span
                          key={`${s.id}-${paused}`}
                          className="animate-hero-progress block h-full w-full bg-white"
                          style={{
                            animationPlayState: paused ? "paused" : "running",
                            ["--hero-interval" as string]: `${INTERVAL_MS}ms`,
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  aria-label="Événement précédent"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition-colors hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  aria-label="Événement suivant"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition-colors hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {upNext.length > 0 && (
            <div className="hidden space-y-2 lg:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                À suivre
              </p>
              {upNext.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(slides.indexOf(s))}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-2 text-left backdrop-blur transition-colors hover:bg-white/20"
                >
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                    {s.image && (
                      <Image src={s.image} alt="" fill sizes="80px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{s.title}</span>
                    <span className="block truncate text-xs text-white/70">{s.date}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4 border-t border-white/10 pt-6 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:space-y-0">
          <div className="lg:w-full lg:max-w-xl">{search}</div>
          {trust}
        </div>
      </Container>
    </section>
  );
}
