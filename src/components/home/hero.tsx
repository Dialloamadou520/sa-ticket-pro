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
      <Container className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-brand-100 backdrop-blur">
            🇸🇳 La billetterie nouvelle génération en Afrique
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Vendez et achetez vos tickets,
            <span className="block bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text text-transparent">
              en toute simplicité.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-200">
            Créez votre événement en quelques minutes, encaissez avec Wave et
            Orange Money, et contrôlez les entrées grâce aux QR codes.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-slate-900 transition-transform hover:scale-[1.02]"
            >
              Explorer les événements
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/evenements/nouveau"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
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
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-300">{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
