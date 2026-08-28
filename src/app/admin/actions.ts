"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { FeeMode, UserRole } from "@/lib/types";

const FEE_MODES: FeeMode[] = ["service_fee", "commission", "none"];

const USER_ROLES: UserRole[] = ["participant", "organizer", "admin"];

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

/**
 * Vérifie que l'appelant est bien administrateur avant toute mutation.
 * Renvoie son identifiant, utile pour les garde-fous « pas sur soi-même ».
 */
async function assertAdmin(): Promise<string> {
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
  return user.id;
}

/**
 * Publie un événement quel que soit son statut de départ (brouillon, refusé,
 * annulé…), sans attendre que l'organisateur le soumette. Réservé aux admins :
 * passe par le service-role car les RLS de `events` ciblent le propriétaire.
 */
export async function publishEventAsAdmin(id: string) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ status: "published" })
    .eq("id", id);
  if (error) throw new Error("Publication impossible.");
  revalidatePath("/admin");
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
 * Définit le taux de commission plateforme d'un événement (0–1, ex. 0.1 = 10 %).
 * Réservé aux administrateurs. Le taux sert au calcul des commissions affichées
 * dans l'administration (par événement, par organisateur, par mois et au global).
 */
export async function setEventCommission(id: string, rate: number) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error("Taux de commission invalide (doit être entre 0 et 1).");
  }
  const admin = createAdminClient();
  await admin
    .from("events")
    .update({ commission_rate: Math.round(rate * 10000) / 10000 })
    .eq("id", id);
  revalidatePath("/admin");
}

/**
 * Définit le mode de frais de service d'un événement (barème standard,
 * commission 1,5 % ou aucun frais). Réservé aux administrateurs : les
 * organisateurs ne choisissent plus ce réglage.
 */
export async function setEventFeeMode(id: string, mode: FeeMode) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  if (!FEE_MODES.includes(mode)) {
    throw new Error("Mode de frais invalide.");
  }
  const admin = createAdminClient();
  await admin.from("events").update({ fee_mode: mode }).eq("id", id);
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

/**
 * Change le rôle d'un utilisateur (participant / organisateur / administrateur).
 * Réservé aux administrateurs. Un admin ne peut pas modifier son propre rôle,
 * pour éviter de se retirer l'accès par mégarde.
 */
export async function setUserRole(userId: string, role: UserRole) {
  if (!isSupabaseConfigured) return;
  const callerId = await assertAdmin();
  if (!USER_ROLES.includes(role)) throw new Error("Rôle invalide.");
  if (userId === callerId) {
    throw new Error("Vous ne pouvez pas modifier votre propre rôle.");
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error("Mise à jour du rôle impossible.");
  await admin.auth.admin.updateUserById(userId, { user_metadata: { role } });
  revalidatePath("/admin");
}

/**
 * Donne un rôle à un utilisateur désigné par son email (il doit déjà avoir un
 * compte). Renvoie le nom/email de la personne pour confirmation côté UI.
 */
export async function setUserRoleByEmail(email: string, role: UserRole) {
  if (!isSupabaseConfigured) return null;
  await assertAdmin();
  const clean = email.trim().toLowerCase();
  if (!clean) throw new Error("Email requis.");
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .ilike("email", clean)
    .maybeSingle();
  if (!profile) {
    throw new Error("Aucun compte avec cet email. La personne doit d'abord s'inscrire.");
  }
  await setUserRole(profile.id, role);
  return { name: profile.full_name ?? profile.email ?? clean };
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
