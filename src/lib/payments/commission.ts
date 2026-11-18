import type { FeePayer } from "@/lib/types";

/**
 * Frais de service de la plateforme, ajoutés au prix d'un ticket et payés par
 * l'acheteur (inclus dans le total débité, **par ticket**). Le revenu de
 * l'organisateur reste le prix de base ; les frais reviennent à la plateforme.
 *
 * Un seul mode : un pourcentage du prix unitaire, réglé par l'administrateur
 * globalement (1,5 % par défaut, 0 % possible) et, si besoin, affiné par
 * catégorie de ticket (Standard, VIP…).
 *
 * Source de vérité partagée entre l'affichage (achat) et le calcul serveur
 * (montant débité).
 */

/** Pourcentage de frais appliqué tant que l'admin n'a rien réglé. */
export const DEFAULT_FEE_PERCENT = 1.5;

/** Plancher autorisé : 0 % = aucun frais pour l'acheteur. */
export const MIN_FEE_PERCENT = 0;

/** Ramène un pourcentage saisi dans la plage autorisée. */
export function normalizeFeePercent(percent: number | null | undefined): number {
  if (typeof percent !== "number" || !Number.isFinite(percent)) {
    return DEFAULT_FEE_PERCENT;
  }
  return Math.min(100, Math.max(MIN_FEE_PERCENT, percent));
}

/**
 * Taux appliqué à un achat, du plus précis au plus général :
 * catégorie de ticket → événement → taux global de la plateforme.
 */
export function resolveFeePercent(
  tierPercent: number | null | undefined,
  eventPercent: number | null | undefined,
  globalPercent: number,
): number {
  if (typeof tierPercent === "number" && Number.isFinite(tierPercent)) {
    return normalizeFeePercent(tierPercent);
  }
  if (typeof eventPercent === "number" && Number.isFinite(eventPercent)) {
    return normalizeFeePercent(eventPercent);
  }
  return normalizeFeePercent(globalPercent);
}

/**
 * Qui supporte les frais d'un achat : la catégorie de ticket si elle a son
 * propre réglage, sinon l'événement, sinon l'acheteur.
 */
export function resolveFeePayer(
  tierPayer: FeePayer | null | undefined,
  eventPayer: FeePayer | null | undefined,
): FeePayer {
  if (tierPayer === "buyer" || tierPayer === "organizer") return tierPayer;
  return eventPayer === "organizer" ? "organizer" : "buyer";
}

/** Frais par ticket pour un prix unitaire donné (arrondi au FCFA). */
export function feeForUnitPrice(unitPrice: number, percent: number): number {
  if (!unitPrice || unitPrice <= 0) return 0;
  return Math.round((unitPrice * normalizeFeePercent(percent)) / 100);
}
