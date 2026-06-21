import Link from "next/link";
import { ArrowRight, CalendarCheck, ShieldCheck, Smartphone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SearchBar } from "@/components/events/search-bar";

const stats = [
  { value: "500+", label: "Événements" },
  { value: "50 000+", label: "Tickets vendus" },
  { value: "120+", label: "Organisateurs" },
];

const highlights = [
  { icon: Smartphone, label: "Paiement Wave & Orange Money" },
  { icon: ShieldCheck, label: "QR codes sécurisés" },
  { icon: CalendarCheck, label: "Gestion en temps réel" },
];

export function Hero() {
  return (
    <section className="gradient-hero relative overflow-hidden text-white">
      {/* halos décoratifs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-32 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />

      <Container className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-brand-100 backdrop-blur">
            🇸🇳 La billetterie nouvelle génération en Afrique
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Vendez et achetez vos tickets,
            <span className="block text-gradient-brand">en toute simplicité.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-200">
            Créez votre événement en quelques minutes, encaissez avec Wave et
            Orange Money, et contrôlez les entrées grâce aux QR codes.
          </p>

          <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/15 backdrop-blur">
            <SearchBar />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-400 to-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-900/30 transition-transform hover:scale-[1.03]"
            >
              Explorer les événements
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/evenements/nouveau"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3 font-medium text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              Créer un événement
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-300">
            {highlights.map((h) => (
              <span key={h.label} className="inline-flex items-center gap-2">
                <h.icon className="h-4 w-4 text-brand-300" />
                {h.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/5 py-5 text-center backdrop-blur"
            >
              <p className="text-2xl font-bold sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-300">{s.label}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* vague de transition vers la section suivante */}
      <svg
        className="block w-full text-white"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,40 C360,90 1080,-10 1440,40 L1440,80 L0,80 Z"
        />
      </svg>
    </section>
  );
}
