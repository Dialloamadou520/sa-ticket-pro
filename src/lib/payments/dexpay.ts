/**
 * DexPay (DEXCHANGE PAY) integration — Wave, Orange Money, MTN, Moov.
 *
 * Docs : https://docs.dexpay.africa
 * Flux retenu : checkout session hébergée.
 *   1. On crée une "checkout session" (POST /checkout-sessions, header x-api-key
 *      = clé publique pk_...). DexPay renvoie une `payment_url`.
 *   2. On redirige le client vers `payment_url` : il choisit son opérateur et paie.
 *   3. DexPay nous notifie via webhook `checkout.completed` (signé HMAC-SHA256).
 *
 * Clés (voir https://docs.dexpay.africa/authentication) :
 *   - DEXPAY_PUBLIC_KEY  : pk_live_... / pk_test_... (x-api-key, checkout sessions)
 *   - DEXPAY_SECRET_KEY  : sk_live_... / sk_test_... (opérations sensibles + webhook)
 *   - DEXPAY_WEBHOOK_SECRET : optionnel ; à défaut on utilise DEXPAY_SECRET_KEY
 *   - DEXPAY_BASE_URL    : https://api.dexpay.africa/api/v1 (prod) ou sandbox
 */

const DEXPAY_BASE_URL =
  process.env.DEXPAY_BASE_URL ?? "https://api.dexpay.africa/api/v1";

export interface CreateCheckoutInput {
  amount: number;
  currency: string;
  reference: string; // notre id de paiement interne
  itemName: string;
  countryISO?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  webhookUrl: string;
  successUrl: string;
  failureUrl: string;
  metadata?: Record<string, unknown>;
}

export interface CreateCheckoutResult {
  paymentUrl: string;
  providerReference: string;
}

export function isDexpayConfigured(): boolean {
  return Boolean(process.env.DEXPAY_PUBLIC_KEY);
}

interface CheckoutSessionResponse {
  id?: string;
  reference?: string;
  payment_url?: string;
  checkout_url?: string;
  data?: CheckoutSessionResponse;
}

/**
 * Crée une checkout session DexPay et renvoie l'URL de paiement hébergée vers
 * laquelle rediriger le client.
 */
export async function createDexpayCheckout(
  input: CreateCheckoutInput
): Promise<CreateCheckoutResult> {
  const apiKey = process.env.DEXPAY_PUBLIC_KEY;
  if (!apiKey) throw new Error("DEXPAY_PUBLIC_KEY manquant.");

  const res = await fetch(`${DEXPAY_BASE_URL}/checkout-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      reference: input.reference,
      item_name: input.itemName,
      amount: input.amount,
      currency: input.currency,
      countryISO: input.countryISO ?? "SN",
      webhook_url: input.webhookUrl,
      success_url: input.successUrl,
      failure_url: input.failureUrl,
      ...(input.customerName || input.customerEmail || input.customerPhone
        ? {
            customer: {
              name: input.customerName,
              email: input.customerEmail,
              phone: input.customerPhone,
            },
          }
        : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Échec création session DexPay : ${res.status} ${text}`);
  }

  const json = (await res.json()) as CheckoutSessionResponse;
  const session = json.data ?? json;
  const paymentUrl = session.payment_url ?? session.checkout_url;
  if (!paymentUrl) {
    throw new Error("Réponse DexPay invalide (payment_url manquante).");
  }

  return {
    paymentUrl,
    providerReference: session.id ?? session.reference ?? input.reference,
  };
}

export interface CheckoutStatus {
  status: string;
  paid: boolean;
  totalPayments: number;
}

/**
 * Récupère l'état d'une checkout session auprès de DexPay (source de vérité),
 * par sa référence métier (= notre id de paiement). Sert à confirmer un
 * paiement sans dépendre du webhook. Lecture avec la clé publique (x-api-key).
 * Voir GET /checkout-sessions/{reference}.
 */
export async function getDexpayCheckoutStatus(
  reference: string
): Promise<CheckoutStatus | null> {
  const apiKey = process.env.DEXPAY_PUBLIC_KEY;
  if (!apiKey) return null;

  const res = await fetch(`${DEXPAY_BASE_URL}/checkout-sessions/${reference}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    status?: string;
    total_payments?: number;
    data?: { status?: string; total_payments?: number };
  };
  const session = json.data ?? json;
  const status = String(session.status ?? "").toLowerCase();
  const totalPayments = Number(session.total_payments ?? 0);
  const paid =
    status === "completed" || status === "paid" || status === "success";

  return { status, paid, totalPayments };
}

/**
 * Vérifie la signature d'un webhook DexPay : HMAC-SHA256 du corps JSON
 * (`JSON.stringify(payload)`), comparé à l'en-tête `x-dexchange-signature`.
 * Voir https://docs.dexpay.africa/architecture.
 */
export async function verifyDexpaySignature(
  payload: unknown,
  signature: string | null
): Promise<boolean> {
  const secret =
    process.env.DEXPAY_WEBHOOK_SECRET ?? process.env.DEXPAY_SECRET_KEY;
  if (!secret || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(JSON.stringify(payload))
  );
  const expected = Buffer.from(sigBuffer).toString("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
