import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sampleEvents } from "@/lib/sample-data";
import type { Event, Profile } from "@/lib/types";

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  pendingEvents: number;
  totalRevenue: number;
  platformCommission: number;
}

/** Commission de la plateforme (10%). */
export const PLATFORM_COMMISSION_RATE = 0.1;

export async function getAdminStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured) {
    const revenue = sampleEvents.reduce((s, e) => s + e.tickets_sold * e.price, 0);
    return {
      totalUsers: 1280,
      totalEvents: sampleEvents.length,
      pendingEvents: 2,
      totalRevenue: revenue,
      platformCommission: Math.round(revenue * PLATFORM_COMMISSION_RATE),
    };
  }

  const supabase = await createClient();
  const [{ count: users }, { data: events }, { data: payments }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("events").select("status, tickets_sold, price"),
      supabase.from("payments").select("amount").eq("status", "paid"),
    ]);

  const revenue = (payments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const eventRows = events ?? [];

  return {
    totalUsers: users ?? 0,
    totalEvents: eventRows.length,
    pendingEvents: eventRows.filter((e) => e.status === "pending").length,
    totalRevenue: revenue,
    platformCommission: Math.round(revenue * PLATFORM_COMMISSION_RATE),
  };
}

export async function getPendingEvents(): Promise<Event[]> {
  if (!isSupabaseConfigured) {
    return sampleEvents.slice(0, 2).map((e) => ({ ...e, status: "pending" }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, category:categories(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data as Event[]) ?? [];
}

export async function getAllUsers(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Profile[]) ?? [];
}
