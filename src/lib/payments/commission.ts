/**
 * Frais de service de la plateforme, ajoutés au prix d'un ticket et payés par
 * l'acheteur (inclus dans le total débité, **par ticket**). Le revenu de
 * l'organisateur reste le prix de base ; les frais reviennent à la plateforme.
 *
 * Un seul mode : un pourcentage du prix unitaire, réglé globalement par
 * l'administrateur (1,5 % par défaut, jamais en dessous).
 *
 * Source de vérité partagée entre l'affichage (achat) et le calcul serveur
 * (montant débité).
 */

/** Pourcentage de frais par défaut et plancher autorisé. */
export const DEFAULT_FEE_PERCENT = 1.5;

/** Ramène un pourcentage saisi dans la plage autorisée. */
export function normalizeFeePercent(percent: number | null | undefined): number {
  if (typeof percent !== "number" || !Number.isFinite(percent)) {
    return DEFAULT_FEE_PERCENT;
  }
  return Math.min(100, Math.max(DEFAULT_FEE_PERCENT, percent));
}

/** Frais par ticket pour un prix unitaire donné (arrondi au FCFA). */
export function feeForUnitPrice(unitPrice: number, percent: number): number {
  if (!unitPrice || unitPrice <= 0) return 0;
  return Math.round((unitPrice * normalizeFeePercent(percent)) / 100);
}
