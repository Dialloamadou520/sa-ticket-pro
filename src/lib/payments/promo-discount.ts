import type { DiscountType } from "@/lib/types";

/**
 * Réduction (FCFA) accordée sur un sous-total, plafonnée au sous-total. La
 * réduction s'applique à **chaque** ticket : un montant fixe est multiplié par
 * la quantité, un pourcentage porte déjà sur le sous-total.
 */
export function discountFor(
  promo: { discount_type: DiscountType; discount_value: number },
  subtotal: number,
  quantity = 1,
): number {
  if (promo.discount_value <= 0 || subtotal <= 0) return 0;
  const qty = Math.max(1, Math.round(quantity) || 1);
  const raw =
    promo.discount_type === "percent"
      ? Math.round((subtotal * promo.discount_value) / 100)
      : promo.discount_value * qty;
  return Math.min(subtotal, Math.max(0, raw));
}
