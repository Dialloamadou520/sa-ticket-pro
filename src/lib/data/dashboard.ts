import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sampleEvents } from "@/lib/sample-data";
import type { Event, Ticket } from "@/lib/types";

export interface OrganizerStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  publishedEvents: number;
}

export async function getMyEvents(): Promise<Event[]> {
  if (!isSupabaseConfigured) return sampleEvents;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!organizer) return [];

  const { data } = await supabase
    .from("events")
    .select("*, category:categories(*)")
    .eq("organizer_id", organizer.id)
    .order("created_at", { ascending: false });

  return (data as Event[]) ?? [];
}

export async function getOrganizerStats(): Promise<OrganizerStats> {
  const events = await getMyEvents();
  return {
    totalEvents: events.length,
    publishedEvents: events.filter((e) => e.status === "published").length,
    totalTicketsSold: events.reduce((s, e) => s + e.tickets_sold, 0),
    totalRevenue: events.reduce((s, e) => s + e.tickets_sold * e.price, 0),
  };
}

export async function getEventParticipants(eventId: string): Promise<Ticket[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return (data as Ticket[]) ?? [];
}
