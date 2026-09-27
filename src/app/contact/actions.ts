"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { notifySupportOnWhatsapp } from "@/lib/notifications/whatsapp";

export interface ContactSubmission {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface ContactResult {
  ok: boolean;
  error?: string;
}

function clean(value: string, max: number) {
  return value.trim().slice(0, max);
}

/**
 * Enregistre le message du visiteur puis prévient le service client sur
 * WhatsApp. L'échec de la notification n'annule pas l'enregistrement.
 */
export async function submitContactMessage(
  input: ContactSubmission
): Promise<ContactResult> {
  const name = clean(input.name, 120);
  const email = clean(input.email, 160);
  const phone = clean(input.phone, 40);
  const subject = clean(input.subject, 160);
  const message = clean(input.message, 4000);

  if (!name || !email || !subject || !message) {
    return { ok: false, error: "Merci de remplir tous les champs requis." };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Service indisponible pour le moment." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contact_messages")
    .insert({ name, email, phone: phone || null, subject, message })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Envoi impossible, réessayez dans un instant." };
  }

  const sent = await notifySupportOnWhatsapp(
    `Nouveau message kaypass — ${subject} — de ${name} (${email}${phone ? `, ${phone}` : ""}) : ${message.slice(0, 600)}`
  );
  if (sent) {
    await admin
      .from("contact_messages")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  revalidatePath("/admin/messages");
  return { ok: true };
}
