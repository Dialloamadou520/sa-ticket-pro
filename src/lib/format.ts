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

/**
 * Durée par défaut d'un événement (heures) quand aucune heure de fin n'est
 * renseignée : l'événement reste « en cours » pendant ce délai après son début.
 */
export const DEFAULT_EVENT_DURATION_HOURS = 6;

/** Fin effective d'un événement (`ends_at`, ou début + durée par défaut). */
export function eventEndsAt(event: {
  starts_at: string;
  ends_at: string | null;
}): Date {
  if (event.ends_at) return new Date(event.ends_at);
  return new Date(
    new Date(event.starts_at).getTime() +
      DEFAULT_EVENT_DURATION_HOURS * 3_600_000
  );
}

/** Un événement est terminé lorsque sa fin effective est passée. */
export function isEventPast(
  event: { starts_at: string; ends_at: string | null },
  now: Date = new Date()
): boolean {
  return eventEndsAt(event).getTime() < now.getTime();
}

/** Un événement est en cours entre son début et sa fin effective. */
export function isEventOngoing(
  event: { starts_at: string; ends_at: string | null },
  now: Date = new Date()
): boolean {
  return (
    new Date(event.starts_at).getTime() <= now.getTime() &&
    !isEventPast(event, now)
  );
}

/**
 * Jauge de remplissage à afficher au public : pourcentage choisi par
 * l'organisateur, ou `null` si aucune jauge n'est configurée. Les ventes
 * réelles ne sont jamais exposées à l'acheteur.
 */
export function displayFillPercent(event: {
  display_fill_percent?: number | null;
}): number | null {
  const value = event.display_fill_percent;
  if (value === null || value === undefined) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
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
 * "Terminé", "En cours", "Aujourd'hui", "Demain" ou "J-5".
 */
export function countdownLabel(
  event: { starts_at: string; ends_at: string | null },
  now: Date = new Date()
): string {
  if (isEventPast(event, now)) return "Terminé";
  const target = new Date(event.starts_at);
  if (target.getTime() <= now.getTime()) return "En cours";
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `J-${days}`;
}
