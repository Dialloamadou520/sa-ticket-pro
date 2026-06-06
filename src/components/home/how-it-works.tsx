import { Container } from "@/components/ui/container";
import { CalendarPlus, CreditCard, QrCode } from "lucide-react";

const steps = [
  {
    icon: CalendarPlus,
    title: "1. Créez votre événement",
    text: "Renseignez les détails, ajoutez une bannière et fixez vos prix en quelques minutes.",
  },
  {
    icon: CreditCard,
    title: "2. Vendez vos tickets",
    text: "Vos participants paient en ligne avec Wave ou Orange Money, en toute sécurité.",
  },
  {
    icon: QrCode,
    title: "3. Scannez à l'entrée",
    text: "Chaque ticket possède un QR code unique. Contrôlez les accès depuis votre téléphone.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16">
      <Container>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Comment ça marche ?
          </h2>
          <p className="mt-2 text-slate-500">
            Trois étapes simples pour lancer votre billetterie
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <step.icon className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
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
