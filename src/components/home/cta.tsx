import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";

export function CtaSection() {
  return (
    <section className="py-16">
      <Container>
        <div className="gradient-hero relative overflow-hidden rounded-3xl px-8 py-16 text-center text-white">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
              Prêt à organiser votre prochain événement ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-200">
              Rejoignez les organisateurs qui font confiance à Sa Ticket Pro pour
              vendre leurs tickets partout au Sénégal et en Afrique.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/inscription"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-slate-900 transition-transform hover:scale-[1.03]"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/explorer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-7 py-3.5 font-medium text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                Explorer les événements
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
