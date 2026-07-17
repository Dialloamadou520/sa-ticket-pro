import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CURRENCY_LABEL } from "./constants";

/** Format a price (integer FCFA) as `12 000 FCFA`. Free events show "Gratuit". */
export function formatPrice(amount: number): string {
  if (!amount || amount <= 0) return "Gratuit";
  return `${amount.toLocaleString("fr-FR")} ${CURRENCY_LABEL}`;
}

/** Format a monetary amount (revenue, commission…) as `12 000 FCFA`; zero shows `0 FCFA`. */
export function formatAmount(amount: number): string {
  return `${(amount || 0).toLocaleString("fr-FR")} ${CURRENCY_LABEL}`;
}

export function formatDate(date: string | Date, pattern = "EEEE d MMMM yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: fr });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH'h'mm", { locale: fr });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM yyyy", { locale: fr });
}

/**
 * Étiquette de compte à rebours basée sur les jours calendaires :
 * "Terminé", "Aujourd'hui", "Demain" ou "J-5".
 */
export function countdownLabel(date: string | Date, now: Date = new Date()): string {
  const target = typeof date === "string" ? new Date(date) : date;
  if (target.getTime() <= now.getTime()) return "Terminé";
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `J-${days}`;
}
