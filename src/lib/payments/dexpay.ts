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

/** Opérateurs mobile money supportés (Sénégal). */
export type DexpayOperator = "wave_sn" | "om_sn";

const OPERATOR_MAP: Record<string, DexpayOperator> = {
  wave: "wave_sn",
  orange_money: "om_sn",
};

export function toDexpayOperator(provider: string): DexpayOperator | null {
  return OPERATOR_MAP[provider] ?? null;
}

/**
 * Normalise un numéro sénégalais au format attendu par DexPay : 9 chiffres
 * (sans indicatif). Renvoie null si invalide.
 */
export function normalizeSenegalPhone(raw: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  const local = digits.startsWith("221") ? digits.slice(3) : digits;
  return /^[0-9]{9}$/.test(local) ? local : null;
}

/** Providers de retrait DexPay (Sénégal). Voir GET /payouts-providers. */
const PAYOUT_OPERATOR_MAP: Record<string, string> = {
  wave: "wave_sn_payout",
  orange_money: "om_sn_payout",
};

export function toDexpayPayoutOperator(provider: string): string | null {
  return PAYOUT_OPERATOR_MAP[provider] ?? null;
}

/** Les payouts exigent la clé secrète en plus de la clé publique. */
export function isDexpayPayoutConfigured(): boolean {
  return Boolean(process.env.DEXPAY_PUBLIC_KEY && process.env.DEXPAY_SECRET_KEY);
}

function payoutHeaders(): Record<string, string> {
  const apiKey = process.env.DEXPAY_PUBLIC_KEY;
  const apiSecret = process.env.DEXPAY_SECRET_KEY;
  if (!apiKey || !apiSecret) {
    throw new Error("DEXPAY_PUBLIC_KEY / DEXPAY_SECRET_KEY manquants.");
  }
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "x-api-secret": apiSecret,
  };
}

export interface PayoutResult {
  id: string;
  reference: string | null;
  /** PENDING | PROCESSING | COMPLETED | FAILED | CANCELLED (normalisé en minuscules). */
  status: string;
  failureReason: string | null;
}

interface PayoutResponse {
  id?: string;
  reference?: string | null;
  status?: string;
  failure_reason?: string | null;
  data?: PayoutResponse;
}

function toPayoutResult(json: PayoutResponse): PayoutResult {
  const data = json.data ?? json;
  return {
    id: String(data.id ?? ""),
    reference: data.reference ?? null,
    status: String(data.status ?? "pending").toLowerCase(),
    failureReason: data.failure_reason ?? null,
  };
}

/**
 * Envoie de l'argent depuis le solde marchand vers un compte mobile money.
 * Le destinataire reçoit exactement `amount` ; les frais DexPay sont débités
 * en plus du solde marchand. Voir POST /payouts.
 */
export async function createDexpayPayout(input: {
  amount: number;
  currency: string;
  /** Numéro local à 9 chiffres (normalisé en +221XXXXXXXXX). */
  phone: string;
  /** `wave` ou `orange_money`. */
  provider: string;
  recipientName?: string;
  metadata?: Record<string, unknown>;
}): Promise<PayoutResult> {
  const operator = toDexpayPayoutOperator(input.provider);
  if (!operator) throw new Error("Opérateur de reversement non supporté.");

  const res = await fetch(`${DEXPAY_BASE_URL}/payouts`, {
    method: "POST",
    headers: payoutHeaders(),
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      destination_phone: `+221${input.phone}`,
      destination_details: {
        operator,
        countryISO: "SN",
        ...(input.recipientName ? { recipient_name: input.recipientName } : {}),
      },
      ...(input.metadata ? { metadata: input.metadata } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Échec du reversement DexPay : ${res.status} ${text}`);
  }
  return toPayoutResult((await res.json()) as PayoutResponse);
}

/** État d'un payout auprès de DexPay. Voir GET /payouts/{id}. */
export async function getDexpayPayout(id: string): Promise<PayoutResult | null> {
  const res = await fetch(`${DEXPAY_BASE_URL}/payouts/${id}`, {
    headers: payoutHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return toPayoutResult((await res.json()) as PayoutResponse);
}

export interface PaymentAttemptResult {
  status: string;
  /** Lien de paiement opérateur (Wave) ; null pour un push USSD/OTP (OM). */
  cashoutUrl: string | null;
}

/**
 * Déclenche une tentative de paiement intégrée (sans page DexPay hébergée).
 * - Wave : renvoie `cashoutUrl` (lien pay.wave.com) à ouvrir par le client.
 * - Orange Money : push/USSD sur le téléphone du client (cashoutUrl null).
 * Voir POST /checkout-sessions/{reference}/transaction-attempt.
 */
export async function createDexpayPaymentAttempt(input: {
  reference: string;
  operator: DexpayOperator;
  customerName: string;
  customerPhone: string;
  countryISO?: string;
}): Promise<PaymentAttemptResult> {
  const apiKey = process.env.DEXPAY_PUBLIC_KEY;
  if (!apiKey) throw new Error("DEXPAY_PUBLIC_KEY manquant.");

  const res = await fetch(
    `${DEXPAY_BASE_URL}/checkout-sessions/${input.reference}/transaction-attempt`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        payment_method: "mobile_money",
        operator: input.operator,
        customer: { name: input.customerName, phone: input.customerPhone },
        countryISO: input.countryISO ?? "SN",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Échec tentative de paiement DexPay : ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    status?: string;
    cashout_url?: string | null;
    data?: { status?: string; cashout_url?: string | null };
  };
  const data = json.data ?? json;
  return {
    status: String(data.status ?? "pending").toLowerCase(),
    cashoutUrl: data.cashout_url ?? null,
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
