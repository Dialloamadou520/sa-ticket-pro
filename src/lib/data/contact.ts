import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  handled: boolean;
  notifiedAt: string | null;
  createdAt: string;
}

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  handled: boolean;
  notified_at: string | null;
  created_at: string;
}

function toMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    handled: row.handled,
    notifiedAt: row.notified_at,
    createdAt: row.created_at,
  };
}

/** La table `contact_messages` existe-t-elle ? (migration 0019 appliquée) */
export async function isContactInboxAvailable(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_messages")
    .select("id", { head: true, count: "exact" })
    .limit(1);
  return !error;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  if (!isSupabaseConfigured) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return ((data ?? []) as ContactMessageRow[]).map(toMessage);
}

/** Nombre de messages non traités, pour la pastille de `/admin`. */
export async function getUnhandledContactCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const admin = createAdminClient();
  const { count } = await admin
    .from("contact_messages")
    .select("id", { head: true, count: "exact" })
    .eq("handled", false);
  return count ?? 0;
}
