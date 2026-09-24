import Link from "next/link";
import Image from "next/image";
import { Globe, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/constants";

const columns: {
  title: string;
  wide?: boolean;
  links: { label: string; href: string }[];
}[] = [
  {
    title: "Plateforme",
    links: [
      { label: "Explorer les événements", href: "/explorer" },
      { label: "Créer un événement", href: "/dashboard/evenements/nouveau" },
      { label: "Tarifs organisateurs", href: "/faq#tarifs" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Vérifier un ticket", href: "/scanner" },
    ],
  },
  {
    title: "Légal",
    wide: true,
    links: [
      { label: "Conditions d'utilisation", href: "/faq" },
      { label: "Confidentialité", href: "/faq" },
      { label: "Mentions légales", href: "/faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-50 sm:mt-20">
      <Container className="py-10 sm:py-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:gap-10 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center" aria-label={SITE.name}>
              <Image
                src="/logo-kaypass.png"
                alt={SITE.name}
                width={2086}
                height={520}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm text-slate-600">{SITE.tagline}.</p>
            <div className="mt-4 flex flex-col gap-1 text-sm">
              <a
                href="mailto:contact@kaypass.com"
                className="inline-flex min-h-11 items-center gap-2 text-slate-600 transition-colors hover:text-brand-600 sm:min-h-0"
              >
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                contact@kaypass.com
              </a>
              <a
                href="tel:+221773525382"
                className="inline-flex min-h-11 items-center gap-2 text-slate-600 transition-colors hover:text-brand-600 sm:min-h-0"
              >
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                +221 77 352 53 82
              </a>
            </div>
            <div className="mt-4 flex gap-3">
              {[Globe, MessageCircle, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Réseau social"
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:text-brand-600 sm:h-9 sm:w-9"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div
              key={col.title}
              className={`min-w-0 ${col.wide ? "col-span-2 lg:col-span-1" : ""}`}
            >
              <h4 className="text-sm font-semibold text-slate-900">{col.title}</h4>
              <ul
                className={`mt-2 text-sm sm:mt-4 ${
                  col.wide
                    ? "grid grid-cols-2 gap-x-4 lg:block lg:space-y-3"
                    : "sm:space-y-3"
                }`}
              >
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex min-h-11 items-center text-slate-600 transition-colors hover:text-brand-600 sm:min-h-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 sm:mt-12 sm:gap-3 sm:text-left sm:text-sm md:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
          </p>
          <p>Fait avec ❤️ au Sénégal 🇸🇳</p>
        </div>
      </Container>
    </footer>
  );
}
