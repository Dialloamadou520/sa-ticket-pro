import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact/contact-form";
import { SUPPORT_PHONES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe kaypass.",
};

interface ContactInfo {
  icon: typeof Mail;
  label: string;
  lines: string[];
  href?: string;
  /** Lien propre à chaque ligne (numéros multiples) ; prioritaire sur `href`. */
  lineHrefs?: string[];
  hint?: string;
}

const infos: ContactInfo[] = [
  {
    icon: Mail,
    label: "Email",
    lines: ["contact@kaypass.com"],
    href: "mailto:contact@kaypass.com",
    hint: "Réponse sous 24h",
  },
  {
    icon: Phone,
    label: "Service client",
    lines: SUPPORT_PHONES.map((p) => p.label),
    lineHrefs: SUPPORT_PHONES.map((p) => p.href),
    hint: "Appel direct",
  },
  {
    icon: MapPin,
    label: "Adresse",
    lines: ["Saint-Louis, Sénégal"],
    hint: "Sur rendez-vous",
  },
  {
    icon: Clock,
    label: "Horaires",
    lines: ["Lun – Sam : 9h – 20h"],
    hint: "Heure de Dakar",
  },
];

const CARD_CLASS =
  "flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md";

export default function ContactPage() {
  return (
    <div className="bg-gradient-to-b from-brand-50/60 via-white to-white">
      <Container className="py-10 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <MessageCircle className="h-3.5 w-3.5" />
            Nous sommes à votre écoute
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Contactez-nous
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Une question sur un ticket, un événement ou un paiement ? Notre
            équipe basée à Saint-Louis vous répond sous 24h.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:mt-12 lg:grid-cols-5 lg:gap-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            {infos.map((info) => {
              const content = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm">
                    <info.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {info.label}
                    </p>
                    {info.lines.map((line, index) => {
                      const lineHref = info.lineHrefs?.[index];
                      return lineHref ? (
                        <a
                          key={line}
                          href={lineHref}
                          className="block break-words font-semibold text-slate-800 transition-colors hover:text-brand-700"
                        >
                          {line}
                        </a>
                      ) : (
                        <p
                          key={line}
                          className="break-words font-semibold text-slate-800"
                        >
                          {line}
                        </p>
                      );
                    })}
                    {info.hint && (
                      <p className="mt-1 text-xs text-slate-500">{info.hint}</p>
                    )}
                  </div>
                </>
              );
              return info.href ? (
                <a key={info.label} href={info.href} className={CARD_CLASS}>
                  {content}
                </a>
              ) : (
                <div key={info.label} className={CARD_CLASS}>
                  {content}
                </div>
              );
            })}

            <Link
              href="/faq"
              className="rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-4 text-sm text-brand-800 transition-colors hover:bg-brand-100 sm:col-span-2 lg:col-span-1"
            >
              <span className="font-semibold">Une question courante ?</span>{" "}
              Consultez la FAQ, la réponse y est peut-être déjà.
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Écrivez-nous
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Décrivez votre demande, nous revenons vers vous par email.
            </p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
