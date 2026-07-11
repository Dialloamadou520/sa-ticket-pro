import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";

export function CtaSection() {
  return (
    <section className="py-16">
      <Container>
        <div className="gradient-hero relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
            Prêt à organiser votre prochain événement ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-200">
            Rejoignez les organisateurs qui font confiance à kaypass pour
            vendre leurs tickets partout au Sénégal et en Afrique.
          </p>
          <Link
            href="/inscription"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-slate-900 transition-transform hover:scale-[1.02]"
          >
            Commencer gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
