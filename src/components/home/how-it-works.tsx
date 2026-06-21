import { Container } from "@/components/ui/container";
import { CalendarPlus, CreditCard, QrCode } from "lucide-react";

const steps = [
  {
    icon: CalendarPlus,
    title: "Créez votre événement",
    text: "Renseignez les détails, ajoutez une bannière et fixez vos prix en quelques minutes.",
  },
  {
    icon: CreditCard,
    title: "Vendez vos tickets",
    text: "Vos participants paient en ligne avec Wave ou Orange Money, en toute sécurité.",
  },
  {
    icon: QrCode,
    title: "Scannez à l'entrée",
    text: "Chaque ticket possède un QR code unique. Contrôlez les accès depuis votre téléphone.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16">
      <Container>
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Simple &amp; rapide
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Comment ça marche ?
          </h2>
          <p className="mt-2 text-slate-500">
            Trois étapes simples pour lancer votre billetterie
          </p>
        </div>
        <div className="relative grid gap-6 md:grid-cols-3">
          {/* ligne de liaison */}
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden border-t-2 border-dashed border-slate-200 md:block" />
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-md shadow-brand-900/20">
                <step.icon className="h-7 w-7" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-700 ring-1 ring-slate-200">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
