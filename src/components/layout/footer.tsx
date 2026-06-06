import Link from "next/link";
import { Ticket, Globe, MessageCircle, Send } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/constants";

const columns = [
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
    links: [
      { label: "Conditions d'utilisation", href: "/faq" },
      { label: "Confidentialité", href: "/faq" },
      { label: "Mentions légales", href: "/faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Ticket className="h-5 w-5" />
              </span>
              <span className="text-lg">{SITE.name}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-slate-600">{SITE.tagline}.</p>
            <div className="mt-5 flex gap-3">
              {[Globe, MessageCircle, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Réseau social"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:text-brand-600"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900">{col.title}</h4>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-600 transition-colors hover:text-brand-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
          </p>
          <p>Fait avec ❤️ au Sénégal 🇸🇳</p>
        </div>
      </Container>
    </footer>
  );
}
