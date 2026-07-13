import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe kaypass.",
};

interface ContactInfo {
  icon: typeof Mail;
  label: string;
  lines: string[];
  href?: string;
}

const infos: ContactInfo[] = [
  {
    icon: Mail,
    label: "Email",
    lines: ["contact@kaypass.com"],
    href: "mailto:contact@kaypass.com",
  },
  {
    icon: Phone,
    label: "Service client",
    lines: ["+221 77 352 53 82", "+221 71 117 93 93"],
    href: "tel:+221773525382",
  },
  { icon: MapPin, label: "Adresse", lines: ["Saint-Louis, Sénégal"] },
];

export default function ContactPage() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Contactez-nous
        </h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Une question ? Notre équipe vous répond sous 24h.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-3 lg:gap-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          {infos.map((info) => {
            const content = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <info.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {info.label}
                  </p>
                  {info.lines.map((line) => (
                    <p key={line} className="break-words font-medium text-slate-800">
                      {line}
                    </p>
                  ))}
                </div>
              </>
            );
            const className =
              "flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/30";
            return info.href ? (
              <a key={info.label} href={info.href} className={className}>
                {content}
              </a>
            ) : (
              <div key={info.label} className={className}>
                {content}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-2">
          <ContactForm />
        </div>
      </div>
    </Container>
  );
}
