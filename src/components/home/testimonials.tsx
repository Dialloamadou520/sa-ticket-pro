import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";

const testimonials = [
  {
    name: "Awa Ndiaye",
    role: "Organisatrice de concerts, Dakar",
    text: "Sa Ticket Pro a transformé ma billetterie. Les paiements Wave arrivent instantanément et le scan à l'entrée est ultra rapide.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Moussa Sow",
    role: "Promoteur sportif, Thiès",
    text: "Enfin une plateforme pensée pour l'Afrique ! Mes participants paient avec Orange Money sans difficulté.",
    color: "bg-amber-100 text-amber-700",
  },
  {
    name: "Fatou Diop",
    role: "Cheffe de projet événementiel",
    text: "L'interface est moderne et simple. J'ai vendu 2 000 tickets pour mon festival en une semaine.",
    color: "bg-purple-100 text-purple-700",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Testimonials() {
  return (
    <section className="bg-slate-50 py-16">
      <Container>
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Témoignages
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
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
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex gap-1 text-accent-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm text-slate-600">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${t.color}`}
                >
                  {initials(t.name)}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
