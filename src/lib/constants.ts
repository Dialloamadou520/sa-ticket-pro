export const SITE = {
  name: "kaypass",
  tagline: "La billetterie intelligente du Sénégal et de l'Afrique",
  description:
    "Créez, gérez et vendez vos tickets d'événements en ligne avec QR code et paiement mobile (Wave, Orange Money).",
  locale: "fr_SN",
  currency: "XOF",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const SUPPORT_PHONES = [
  { label: "+221 77 352 53 82", href: "tel:+221773525382" },
  { label: "+221 71 117 93 93", href: "tel:+221711179393" },
  { label: "+221 78 927 12 24", href: "tel:+221789271224" },
] as const;

export const CURRENCY_LABEL = "FCFA";

export const TICKET_TYPE_LABELS: Record<string, string> = {
  standard: "Standard",
  vip: "VIP",
  gratuit: "Gratuit",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  published: "Publié",
  rejected: "Refusé",
  cancelled: "Annulé",
};

export const PAYMENT_PROVIDERS = [
  { id: "wave", label: "Wave" },
  { id: "orange_money", label: "Orange Money" },
] as const;
