"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rafraîchit la page de confirmation tant que le paiement n'est pas validé,
 * pour afficher le ticket dès que DexPay confirme (sans action de l'acheteur).
 */
export function AutoRefresh({
  intervalMs = 4000,
  maxAttempts = 8,
}: {
  intervalMs?: number;
  maxAttempts?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (attempts > maxAttempts) {
        clearInterval(timer);
        return;
      }
      router.refresh();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs, maxAttempts]);

  return null;
}
