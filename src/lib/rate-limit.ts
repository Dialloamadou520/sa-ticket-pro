import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Quota d'une action : `max` requêtes par fenêtre de `windowSeconds`. */
export interface RateLimitRule {
  name: string;
  max: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  promoValidate: { name: "promo", max: 20, windowSeconds: 10 * 60 },
  paymentInitiate: { name: "pay", max: 15, windowSeconds: 10 * 60 },
  signup: { name: "signup", max: 5, windowSeconds: 60 * 60 },
  contact: { name: "contact", max: 5, windowSeconds: 60 * 60 },
  ticketVerify: { name: "verify", max: 120, windowSeconds: 60 },
  upload: { name: "upload", max: 30, windowSeconds: 10 * 60 },
} satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

/** IP du client, telle que transmise par Vercel. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Compte une tentative pour `subject` (IP ou id utilisateur). En cas d'erreur
 * (migration absente, base indisponible), la requête est autorisée : une
 * panne du compteur ne doit jamais bloquer les ventes.
 */
export async function hitRateLimit(
  rule: RateLimitRule,
  subject: string
): Promise<RateLimitResult> {
  if (!isSupabaseConfigured) return { allowed: true, retryAfter: 0 };
  const hashed = createHash("sha256").update(subject).digest("hex").slice(0, 32);
  try {
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
      p_key: `${rule.name}:${hashed}`,
      p_max: rule.max,
      p_window_seconds: rule.windowSeconds,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as
      | { allowed: boolean; retry_after: number }
      | undefined;
    if (!row) return { allowed: true, retryAfter: 0 };
    return { allowed: row.allowed, retryAfter: row.retry_after };
  } catch (e) {
    console.error("Limite de tentatives indisponible :", e);
    return { allowed: true, retryAfter: 0 };
  }
}

export function retryMessage(retryAfter: number): string {
  const minutes = Math.ceil(retryAfter / 60);
  return minutes > 1
    ? `Trop de tentatives. Réessayez dans ${minutes} minutes.`
    : "Trop de tentatives. Réessayez dans une minute.";
}

/** Réponse 429 standard, avec l'en-tête `Retry-After`. */
export function tooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: retryMessage(retryAfter) },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
