import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Ticket } from "@/lib/types";

export async function getMyTickets(): Promise<Ticket[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tickets")
    .select("*, event:events(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data as Ticket[]) ?? [];
}
