import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CURRENCY_LABEL } from "./constants";

/** Format a price (integer FCFA) as `12 000 FCFA`. Free events show "Gratuit". */
export function formatPrice(amount: number): string {
  if (!amount || amount <= 0) return "Gratuit";
  return `${amount.toLocaleString("fr-FR")} ${CURRENCY_LABEL}`;
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
