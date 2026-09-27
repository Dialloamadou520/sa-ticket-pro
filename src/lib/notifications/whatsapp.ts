/**
 * Notifications WhatsApp via l'API Cloud de Meta (WhatsApp Business).
 *
 * Docs : https://developers.facebook.com/docs/whatsapp/cloud-api
 * Variables d'environnement :
 *   - WHATSAPP_TOKEN            : token permanent de l'app Meta
 *   - WHATSAPP_PHONE_NUMBER_ID  : identifiant du numéro expéditeur
 *   - WHATSAPP_TEMPLATE_NAME    : modèle validé (défaut `kaypass_contact`)
 *   - WHATSAPP_TEMPLATE_LANG    : langue du modèle (défaut `fr`)
 *   - WHATSAPP_RECIPIENTS       : destinataires au format international,
 *                                 séparés par des virgules (défaut : service client)
 *
 * Meta impose un *template* validé pour initier une conversation : le modèle
 * doit accepter un paramètre texte unique, qui reçoit le résumé du message.
 */

import { SUPPORT_PHONES } from "@/lib/constants";

const GRAPH_VERSION = "v21.0";

export function isWhatsappConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

/** Numéros notifiés, au format international sans séparateurs. */
export function whatsappRecipients(): string[] {
  const configured = process.env.WHATSAPP_RECIPIENTS;
  const raw = configured
    ? configured.split(",")
    : SUPPORT_PHONES.map((p) => p.label);
  return raw
    .map((n) => n.replace(/[^\d+]/g, "").replace(/^\+/, ""))
    .filter(Boolean);
}

async function sendToNumber(to: string, text: string): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: process.env.WHATSAPP_TEMPLATE_NAME ?? "kaypass_contact",
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "fr" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text }],
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`WhatsApp ${res.status} : ${await res.text()}`);
  }
}

/**
 * Envoie le même texte à tous les numéros du service client.
 * Les échecs sont journalisés sans interrompre l'appelant : une notification
 * ratée ne doit jamais faire perdre le message du visiteur.
 */
export async function notifySupportOnWhatsapp(text: string): Promise<boolean> {
  if (!isWhatsappConfigured()) return false;

  const results = await Promise.allSettled(
    whatsappRecipients().map((to) => sendToNumber(to, text))
  );

  let sent = false;
  for (const result of results) {
    if (result.status === "fulfilled") sent = true;
    else console.error("Notification WhatsApp échouée :", result.reason);
  }
  return sent;
}
