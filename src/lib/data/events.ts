import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getSampleEventBySlug,
  sampleCategories,
  sampleEvents,
} from "@/lib/sample-data";
import type { Category, Event } from "@/lib/types";

export interface EventFilters {
  category?: string;
  city?: string;
  search?: string;
}

const EVENT_SELECT = "*, category:categories(*)";

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return sampleCategories;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data ?? sampleCategories;
}

export async function getPublishedEvents(
  filters: EventFilters = {}
): Promise<Event[]> {
  if (!isSupabaseConfigured) {
    return filterSampleEvents(filters);
  }

  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  if (filters.category) {
    const cat = sampleCategories.find((c) => c.slug === filters.category);
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.search) query = query.ilike("title", `%${filters.search}%`);

  const { data } = await query;
  return (data as Event[]) ?? [];
}

export async function getPopularEvents(limit = 6): Promise<Event[]> {
  if (!isSupabaseConfigured) {
    return [...sampleEvents]
      .sort((a, b) => b.tickets_sold - a.tickets_sold)
      .slice(0, limit);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .order("tickets_sold", { ascending: false })
    .limit(limit);
  return (data as Event[]) ?? [];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  if (!isSupabaseConfigured) {
    return getSampleEventBySlug(slug) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Event) ?? null;
}

function filterSampleEvents(filters: EventFilters): Event[] {
  return sampleEvents.filter((e) => {
    if (filters.category && e.category?.slug !== filters.category) return false;
    if (
      filters.city &&
      !e.city?.toLowerCase().includes(filters.city.toLowerCase())
    )
      return false;
    if (
      filters.search &&
      !e.title.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });
}
