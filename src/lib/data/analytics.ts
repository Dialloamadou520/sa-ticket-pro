import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface DailyViews {
  /** Clé triable `YYYY-MM-DD`. */
  key: string;
  /** Libellé lisible, ex. « 6 juin ». */
  label: string;
  /** Jour de la semaine abrégé, ex. « lun ». */
  weekday: string;
  /** Samedi ou dimanche. */
  weekend: boolean;
  count: number;
  /** Visiteurs uniques ce jour-là. */
  visitors: number;
}

export interface TopPage {
  path: string;
  label: string;
  count: number;
}

export interface VisitStats {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
  /** Visiteurs uniques sur les 30 derniers jours. */
  uniqueVisitors30: number;
  /** Visites par jour, sur les 30 derniers jours (du plus ancien au plus récent). */
  daily: DailyViews[];
  /** Pages les plus visitées (30 derniers jours). */
  topPages: TopPage[];
}

const DAY_MS = 86_400_000;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Libellé lisible d'un chemin pour l'administration. */
function pathLabel(path: string): string {
  const known: Record<string, string> = {
    "/": "Accueil",
    "/explorer": "Explorer les événements",
    "/contact": "Contact",
    "/faq": "FAQ",
    "/connexion": "Connexion",
    "/inscription": "Inscription",
  };
  if (known[path]) return known[path];
  const ev = /^\/evenements\/([^/?#]+)$/.exec(path);
  if (ev) return `Événement : ${ev[1]}`;
  if (path.startsWith("/evenements/")) return `Événement (${path})`;
  return path;
}

/** Statistiques de fréquentation de la plateforme (visites / « clics »). */
export async function getVisitStats(): Promise<VisitStats> {
  const empty: VisitStats = {
    total: 0,
    today: 0,
    last7Days: 0,
    last30Days: 0,
    uniqueVisitors30: 0,
    daily: [],
    topPages: [],
  };
  if (!isSupabaseConfigured) return empty;

  const supabase = await createClient();
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY_MS);

  const [{ count: total }, { data: rows }] = await Promise.all([
    supabase.from("page_views").select("*", { count: "exact", head: true }),
    supabase
      .from("page_views")
      .select("path, visitor_id, created_at")
      .gte("created_at", since30.toISOString()),
  ]);

  const recent = (rows ?? []) as {
    path: string;
    visitor_id: string | null;
    created_at: string;
  }[];

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const since7 = now.getTime() - 7 * DAY_MS;

  let today = 0;
  let last7Days = 0;
  const visitors = new Set<string>();
  const pathCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  const dayVisitors = new Map<string, Set<string>>();

  for (const r of recent) {
    const t = new Date(r.created_at).getTime();
    if (t >= startOfToday) today += 1;
    if (t >= since7) last7Days += 1;
    if (r.visitor_id) visitors.add(r.visitor_id);
    pathCounts.set(r.path, (pathCounts.get(r.path) ?? 0) + 1);
    const key = dayKey(new Date(r.created_at));
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    if (r.visitor_id) {
      const set = dayVisitors.get(key) ?? new Set<string>();
      set.add(r.visitor_id);
      dayVisitors.set(key, set);
    }
  }

  // 30 derniers jours, y compris les jours sans visite (0).
  const daily: DailyViews[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(startOfToday - i * DAY_MS);
    const key = dayKey(d);
    daily.push({
      key,
      label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      weekday: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      weekend: d.getDay() === 0 || d.getDay() === 6,
      count: dayCounts.get(key) ?? 0,
      visitors: dayVisitors.get(key)?.size ?? 0,
    });
  }

  const topPages: TopPage[] = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, label: pathLabel(path), count }));

  return {
    total: total ?? 0,
    today,
    last7Days,
    last30Days: recent.length,
    uniqueVisitors30: visitors.size,
    daily,
    topPages,
  };
}
