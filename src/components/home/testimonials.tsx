import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";

const testimonials = [
  {
    name: "Awa Ndiaye",
    role: "Organisatrice de concerts, Dakar",
    text: "Sa Ticket Pro a transformé ma billetterie. Les paiements Wave arrivent instantanément et le scan à l'entrée est ultra rapide.",
  },
  {
    name: "Moussa Sow",
    role: "Promoteur sportif, Thiès",
    text: "Enfin une plateforme pensée pour l'Afrique ! Mes participants paient avec Orange Money sans difficulté.",
  },
  {
    name: "Fatou Diop",
    role: "Cheffe de projet événementiel",
    text: "L'interface est moderne et simple. J'ai vendu 2 000 tickets pour mon festival en une semaine.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-slate-50 py-16">
      <Container>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Ils nous font confiance
          </h2>
          <p className="mt-2 text-slate-500">
            Des organisateurs satisfaits partout au Sénégal
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex gap-1 text-accent-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm text-slate-600">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-5">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
