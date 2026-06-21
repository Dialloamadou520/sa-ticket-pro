/**
 * Frais de service de la plateforme, ajoutés au prix d'un ticket et payés par
 * l'acheteur (inclus dans le total débité, **par ticket**). Le revenu de
 * l'organisateur reste le prix de base ; les frais reviennent à la plateforme.
 *
 * Deux modes possibles, résolus par événement :
 *   - `service_fee` : barème fixe par palier de prix unitaire (FCFA)
 *       100 – 500    → 25
 *       501 – 1 000  → 50
 *       1 001 – 1 999 → 150
 *       2 000 – 4 999 → 200
 *       5 000 et plus → 300
 *   - `commission`  : 1,5 % du prix unitaire (arrondi au FCFA)
 *   - `none`        : aucun frais
 *
 * Source de vérité partagée entre l'affichage (achat) et le calcul serveur
 * (montant débité).
 */

import type { FeeMode } from "@/lib/types";

export const COMMISSION_RATE = 0.015; // 1,5 %

/** Barème fixe des frais de service par prix unitaire (FCFA). */
export function flatServiceFee(unitPrice: number): number {
  if (!unitPrice || unitPrice <= 0) return 0;
  if (unitPrice <= 500) return 25;
  if (unitPrice <= 1000) return 50;
  if (unitPrice <= 1999) return 150;
  if (unitPrice <= 4999) return 200;
  return 300;
}

/** Frais par ticket pour un prix unitaire donné, selon le mode résolu. */
export function feeForUnitPrice(unitPrice: number, mode: FeeMode): number {
  if (!unitPrice || unitPrice <= 0) return 0;
  if (mode === "none") return 0;
  if (mode === "commission") return Math.round(unitPrice * COMMISSION_RATE);
  return flatServiceFee(unitPrice);
}

/**
 * Résout le mode effectif d'un événement en tenant compte de l'interrupteur
 * global des frais de service (réglage admin). Le mode `commission` reste
 * actif même si les frais de service globaux sont désactivés (c'est un choix
 * explicite par événement).
 */
export function resolveFeeMode(
  stored: FeeMode | null | undefined,
  globalEnabled: boolean
): FeeMode {
  const mode = stored ?? "service_fee";
  if (mode === "commission") return "commission";
  if (mode === "none") return "none";
  return globalEnabled ? "service_fee" : "none";
}
