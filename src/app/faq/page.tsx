import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, Mail, Store, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FaqAccordion, type FaqItem } from "@/components/faq/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions fréquentes sur kaypass.",
};

const generales: FaqItem[] = [
  {
    q: "Qu'est-ce que kaypass ?",
    a: "kaypass est une plateforme de billetterie en ligne adaptée au Sénégal et à l'Afrique. Elle permet de créer des événements, vendre des tickets avec QR code et encaisser via Wave et Orange Money.",
  },
  {
    q: "Comment acheter un ticket ?",
    a: "Parcourez les événements, sélectionnez celui qui vous intéresse, choisissez la quantité et payez avec Wave ou Orange Money. Vous recevrez vos tickets avec un QR code unique par email et dans votre profil.",
  },
  {
    q: "Le QR code de mon ticket est-il sécurisé ?",
    a: "Oui. Chaque ticket possède un identifiant unique et sécurisé, vérifié côté serveur. Un ticket ne peut être scanné qu'une seule fois à l'entrée, ce qui empêche toute duplication.",
  },
];

const organisateurs: FaqItem[] = [
  {
    q: "Comment créer un événement ?",
    a: "Créez un compte organisateur, accédez à votre tableau de bord puis cliquez sur « Créer un événement ». Renseignez les détails (titre, date, lieu, prix, capacité) et soumettez-le pour validation.",
  },
  {
    q: "Quels sont les frais pour un organisateur ?",
    a: "La création d'événements et les tickets gratuits sont sans frais. Sur les ventes, un pourcentage de frais de service est appliqué : par défaut il est ajouté au prix et payé par l'acheteur, vous percevez donc l'intégralité du prix que vous fixez. Le taux est fixé par kaypass et peut être négocié événement par événement (jusqu'à 0 %), ou pris en charge par l'organisateur.",
  },
  {
    q: "Comment contrôler les entrées le jour J ?",
    a: "Utilisez l'outil Scanner depuis votre téléphone pour scanner les QR codes des participants. Le système valide instantanément chaque ticket et empêche les doublons.",
  },
  {
    q: "Quand suis-je payé ?",
    a: "Les paiements Wave et Orange Money sont confirmés instantanément. Les revenus, déduction faite de la commission, vous sont reversés selon les modalités de votre compte marchand.",
  },
];

export default function FaqPage() {
  return (
    <div className="bg-gradient-to-b from-brand-50/60 via-white to-white">
      <Container className="max-w-3xl py-10 sm:py-14">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <HelpCircle className="h-3.5 w-3.5" />
            Centre d&apos;aide
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Foire aux questions
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Achat de tickets, QR codes, paiements Wave et Orange Money,
            organisation d&apos;événements : tout est ici.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <Users className="h-4 w-4" />
            </span>
            Questions générales
          </h2>
          <FaqAccordion items={generales} />
        </section>

        <section id="tarifs" className="mt-10 scroll-mt-20">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <Store className="h-4 w-4" />
            </span>
            Organisateurs &amp; tarifs
          </h2>
          <FaqAccordion items={organisateurs} />
        </section>

        <div className="mt-10 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 text-center sm:p-7">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Vous n&apos;avez pas trouvé votre réponse ?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Notre équipe vous répond sous 24h.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Mail className="h-4 w-4" />
            Nous contacter
          </Link>
        </div>
      </Container>
    </div>
  );
}
