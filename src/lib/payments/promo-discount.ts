import type { DiscountType } from "@/lib/types";

/** Réduction (FCFA) accordée sur un sous-total, plafonnée au sous-total. */
export function discountFor(
  promo: { discount_type: DiscountType; discount_value: number },
  subtotal: number,
): number {
  if (promo.discount_value <= 0 || subtotal <= 0) return 0;
  const raw =
    promo.discount_type === "percent"
      ? Math.round((subtotal * promo.discount_value) / 100)
      : promo.discount_value;
  return Math.min(subtotal, Math.max(0, raw));
}
