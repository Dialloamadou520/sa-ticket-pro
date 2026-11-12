/** Design de billet enregistré pour une catégorie (partagé papier / numérique). */
export interface SavedTicketDesign {
  imageUrl: string;
  widthMm: number;
  heightMm: number;
  /** Coin haut-gauche (fraction du billet) et côté (fraction de la largeur). */
  qr: { x: number; y: number; size: number };
  /** Centre du numéro (fraction du billet), taille en points. */
  number: { show: boolean; x: number; y: number; sizePt: number; light: boolean };
}

/** Designs d'un événement, indexés par catégorie normalisée. */
export type TicketDesignMap = Record<string, SavedTicketDesign>;

/** Clé de catégorie : « VIP Prestige », « vip  prestige » et « Invitation · VIP Prestige » se valent. */
export function categoryKey(category: string): string {
  return category
    .replace(/^invitation\s*·\s*/i, "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, 80);
}

export function pickDesign(
  designs: TicketDesignMap | undefined,
  category: string
): SavedTicketDesign | undefined {
  return designs?.[categoryKey(category)];
}
