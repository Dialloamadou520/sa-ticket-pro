import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { FaqAccordion, type FaqItem } from "@/components/faq/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions fréquentes sur Sa Ticket Pro.",
};

const generales: FaqItem[] = [
  {
    q: "Qu'est-ce que Sa Ticket Pro ?",
    a: "Sa Ticket Pro est une plateforme de billetterie en ligne adaptée au Sénégal et à l'Afrique. Elle permet de créer des événements, vendre des tickets avec QR code et encaisser via Wave et Orange Money.",
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
    q: "Quels sont les frais ? (tarifs)",
    a: "La plateforme applique une commission de 10% sur les ventes de tickets payants. La création d'événements et les tickets gratuits sont sans frais.",
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
    <Container className="max-w-3xl py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Foire aux questions</h1>
        <p className="mt-2 text-slate-500">
          Tout ce qu&apos;il faut savoir sur Sa Ticket Pro.
        </p>
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold text-slate-900">
        Questions générales
      </h2>
      <FaqAccordion items={generales} />

      <h2 id="tarifs" className="mt-10 mb-3 text-lg font-semibold text-slate-900 scroll-mt-20">
        Organisateurs & tarifs
      </h2>
      <FaqAccordion items={organisateurs} />
    </Container>
  );
}
