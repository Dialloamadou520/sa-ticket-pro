"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function setEventStatus(id: string, status: "published" | "rejected") {
  if (!isSupabaseConfigured) return;
  const supabase = await createClient();
  await supabase.from("events").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function approveEvent(id: string) {
  await setEventStatus(id, "published");
}

export async function rejectEvent(id: string) {
  await setEventStatus(id, "rejected");
}

/** Vérifie que l'appelant est bien administrateur avant toute mutation. */
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("Accès réservé aux administrateurs.");
}

/**
 * Supprime définitivement un événement (et, par cascade, ses tickets, paliers,
 * paiements, contrôleurs et scans). Réservé aux administrateurs.
 */
export async function deleteEventAsAdmin(id: string) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("events").delete().eq("id", id);
  revalidatePath("/admin");
}

/**
 * Désactive un organisateur (soft-delete) : ses événements publiés sont annulés
 * pour disparaître du public, mais aucune donnée n'est supprimée.
 */
export async function removeOrganizer(id: string) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("organizers").update({ disabled: true }).eq("id", id);
  await admin
    .from("events")
    .update({ status: "cancelled" })
    .eq("organizer_id", id)
    .eq("status", "published");
  revalidatePath("/admin");
  revalidatePath(`/admin/organisateurs/${id}`);
}

/**
 * Supprime définitivement un organisateur ainsi que toutes ses données par
 * cascade DB (événements, tickets, paliers, paiements, contrôleurs et scans).
 * Le compte utilisateur (profil/connexion) n'est pas supprimé. Réservé aux admins.
 */
export async function deleteOrganizer(id: string) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("organizers").delete().eq("id", id);
  revalidatePath("/admin");
}

/** Réactive un organisateur précédemment désactivé. */
export async function restoreOrganizer(id: string) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("organizers").update({ disabled: false }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath(`/admin/organisateurs/${id}`);
}

/** Bascule l'état « vérifié » d'un organisateur. */
export async function setOrganizerVerified(id: string, verified: boolean) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("organizers").update({ verified }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath(`/admin/organisateurs/${id}`);
}

/** Active ou désactive globalement les frais de service de la plateforme. */
export async function setServiceFeesEnabled(enabled: boolean) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const admin = createAdminClient();
  await admin
    .from("app_settings")
    .update({ service_fees_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", true);
  revalidatePath("/admin");
}
