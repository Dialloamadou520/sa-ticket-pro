import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe kaypass.",
};

const infos = [
  { icon: Mail, label: "Email", value: "contact@kaypass.com" },
  { icon: Phone, label: "Téléphone", value: "+221 77 000 00 00" },
  { icon: MapPin, label: "Adresse", value: "Dakar, Sénégal" },
];

export default function ContactPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-slate-900">Contactez-nous</h1>
        <p className="mt-2 text-slate-500">
          Une question ? Notre équipe vous répond sous 24h.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          {infos.map((info) => (
            <div
              key={info.label}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <info.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {info.label}
                </p>
                <p className="font-medium text-slate-800">{info.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <ContactForm />
        </div>
      </div>
    </Container>
  );
}
