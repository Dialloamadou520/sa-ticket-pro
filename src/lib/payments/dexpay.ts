/**
 * DexpayAfrica integration (Wave & Orange Money).
 *
 * Docs: https://dexpayafrica.com (configurez vos clés dans `.env`).
 * Cette couche encapsule l'appel de création de paiement et la vérification de
 * signature des webhooks. Les endpoints exacts peuvent varier selon votre compte
 * marchand — ajustez `DEXPAY_BASE_URL` et les champs si nécessaire.
 */

import type { PaymentProvider } from "@/lib/types";

const DEXPAY_BASE_URL =
  process.env.DEXPAY_BASE_URL ?? "https://api.dexpayafrica.com";

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  provider: PaymentProvider; // 'wave' | 'orange_money'
  reference: string; // notre id de paiement interne
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  description: string;
  callbackUrl: string; // webhook serveur
  returnUrl: string; // retour navigateur après paiement
}

export interface CreatePaymentResult {
  checkoutUrl: string;
  providerReference: string;
}

export function isDexpayConfigured(): boolean {
  return Boolean(process.env.DEXPAY_API_KEY);
}

/**
 * Crée une session de paiement chez DexpayAfrica et renvoie l'URL de checkout
 * vers laquelle rediriger le client (page Wave / Orange Money).
 */
export async function createDexpayPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const apiKey = process.env.DEXPAY_API_KEY;
  if (!apiKey) throw new Error("DEXPAY_API_KEY manquant.");

  const res = await fetch(`${DEXPAY_BASE_URL}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      payment_method: input.provider,
      reference: input.reference,
      description: input.description,
      customer: {
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
      },
      callback_url: input.callbackUrl,
      return_url: input.returnUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Échec création paiement DexpayAfrica: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    checkout_url?: string;
    payment_url?: string;
    reference?: string;
    id?: string;
  };

  const checkoutUrl = data.checkout_url ?? data.payment_url;
  if (!checkoutUrl) {
    throw new Error("Réponse DexpayAfrica invalide (URL de checkout manquante).");
  }

  return {
    checkoutUrl,
    providerReference: data.reference ?? data.id ?? input.reference,
  };
}

/**
 * Vérifie la signature d'un webhook DexpayAfrica (HMAC SHA-256 du corps brut).
 * Ajustez l'en-tête / l'algorithme selon la documentation de votre compte.
 */
export async function verifyDexpaySignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  const secret = process.env.DEXPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
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
