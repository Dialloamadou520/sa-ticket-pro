/**
 * Frais de service (commission plateforme) ajoutés au prix d'un ticket et
 * payés par l'acheteur, **par ticket** et par palier de prix unitaire (FCFA) :
 *
 *   gratuit (0)   → 0
 *   1 – 500       → +100
 *   501 – 1 000   → +150
 *   plus de 1 000 → +200
 *
 * Source de vérité partagée entre l'affichage (achat) et le calcul serveur
 * (montant débité). La commission revient à la plateforme : le revenu de
 * l'organisateur reste le prix de base du ticket.
 */
export function serviceFeeForUnitPrice(unitPrice: number): number {
  if (!unitPrice || unitPrice <= 0) return 0;
  if (unitPrice <= 500) return 100;
  if (unitPrice <= 1000) return 150;
  return 200;
}
