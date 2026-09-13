"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { DiscountType, UserRole } from "@/lib/types";
import { MIN_FEE_PERCENT } from "@/lib/payments/commission";

const USER_ROLES: UserRole[] = ["participant", "organizer", "admin"];

const DISCOUNT_TYPES: DiscountType[] = ["percent", "amount"];

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
 * Crée un code de vente pour un collaborateur / ambassadeur.
 * `eventId` vide = code valable sur tous les événements ; `discountValue` à 0 =
 * code de simple suivi (aucune réduction pour l'acheteur).
 */
export async function createPromoCode(input: {
  code: string;
  ownerName: string;
  eventId?: string;
  discountType: DiscountType;
  discountValue: number;
}) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const code = input.code.trim().toUpperCase();
  const ownerName = input.ownerName.trim();
  if (!code || !ownerName) throw new Error("Code et nom du collaborateur requis.");
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
    throw new Error("Code invalide : 3 à 20 caractères (lettres, chiffres, - _).");
  }
  if (!DISCOUNT_TYPES.includes(input.discountType)) {
    throw new Error("Type de réduction invalide.");
  }
  const value = Math.max(0, Math.round(input.discountValue) || 0);
  if (input.discountType === "percent" && value > 100) {
    throw new Error("Le pourcentage ne peut pas dépasser 100.");
  }
  const admin = createAdminClient();
  const { error } = await admin.from("promo_codes").insert({
    code,
    owner_name: ownerName,
    event_id: input.eventId || null,
    discount_type: input.discountType,
    discount_value: value,
  });
  if (error) {
    throw new Error(
      error.code === "23505"
        ? "Ce code existe déjà."
        : "Création du code impossible.",
    );
  }
  revalidatePath("/admin/codes-promo");
}

/** Active / désactive un code de vente (les ventes déjà faites sont conservées). */
export async function setPromoCodeActive(id: string, active: boolean) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("promo_codes")
    .update({ active })
    .eq("id", id);
  if (error) throw new Error("Mise à jour du code impossible.");
  revalidatePath("/admin/codes-promo");
}

/** Supprime un code de vente. Les paiements liés gardent le code en texte. */
export async function deletePromoCode(id: string) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("promo_codes").delete().eq("id", id);
  if (error) throw new Error("Suppression impossible.");
  revalidatePath("/admin/codes-promo");
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

/**
 * Règle le pourcentage global des frais de service payés par l'acheteur.
 * De 0 % (aucun frais) à 100 %.
 */
export async function setServiceFeePercent(percent: number) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  if (!Number.isFinite(percent) || percent < MIN_FEE_PERCENT || percent > 100) {
    throw new Error(`Pourcentage invalide (entre ${MIN_FEE_PERCENT} et 100).`);
  }
  const admin = createAdminClient();
  await admin
    .from("app_settings")
    .update({
      service_fee_percent: Math.round(percent * 100) / 100,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  revalidatePath("/admin");
  revalidatePath("/admin/frais");
}

/**
 * Règle les frais d'une catégorie de ticket (Standard, VIP…). `null` remet la
 * catégorie sur le pourcentage global.
 */
export async function setTierFeePercent(tierId: string, percent: number | null) {
  if (!isSupabaseConfigured) return;
  await assertAdmin();
  if (
    percent !== null &&
    (!Number.isFinite(percent) || percent < MIN_FEE_PERCENT || percent > 100)
  ) {
    throw new Error(`Pourcentage invalide (entre ${MIN_FEE_PERCENT} et 100).`);
  }
  const admin = createAdminClient();
  await admin
    .from("ticket_tiers")
    .update({
      fee_percent: percent === null ? null : Math.round(percent * 100) / 100,
    })
    .eq("id", tierId);
  revalidatePath("/admin/frais");
}
