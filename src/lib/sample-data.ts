import type { Category, Event } from "./types";

/**
 * Local sample data used in "demo mode" (when Supabase is not configured) so the
 * UI is fully browsable for the first preview deploy. Replaced by real Supabase
 * queries once credentials are set.
 */

export const sampleCategories: Category[] = [
  { id: "c1", slug: "concerts", name: "Concerts", icon: "Music", created_at: "" },
  { id: "c2", slug: "festivals", name: "Festivals", icon: "PartyPopper", created_at: "" },
  { id: "c3", slug: "sport", name: "Sport", icon: "Trophy", created_at: "" },
  { id: "c4", slug: "conferences", name: "Conférences", icon: "Mic", created_at: "" },
  { id: "c5", slug: "soirees", name: "Soirées", icon: "Sparkles", created_at: "" },
  { id: "c6", slug: "theatre", name: "Théâtre & Arts", icon: "Drama", created_at: "" },
  { id: "c7", slug: "formations", name: "Formations", icon: "GraduationCap", created_at: "" },
  { id: "c8", slug: "tech", name: "Tech & Startups", icon: "Cpu", created_at: "" },
];

function daysFromNow(days: number, hour = 20): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const sampleEvents: Event[] = [
  {
    id: "e1",
    slug: "grand-concert-dakar-music-night",
    organizer_id: "o1",
    title: "Dakar Music Night",
    description:
      "Une nuit exceptionnelle réunissant les plus grandes stars de la scène musicale sénégalaise et africaine. Ambiance garantie au cœur de Dakar.",
    banner_url:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
    category_id: "c1",
    category: sampleCategories[0],
    location: "Grand Théâtre National",
    city: "Dakar",
    starts_at: daysFromNow(12),
    ends_at: null,
    capacity: 2000,
    price: 10000,
    ticket_type: "standard",
    status: "published",
    tickets_sold: 1240,
    created_at: "",
  },
  {
    id: "e2",
    slug: "festival-saint-louis-jazz",
    organizer_id: "o2",
    title: "Saint-Louis Jazz Festival",
    description:
      "Le rendez-vous incontournable des amateurs de jazz en Afrique de l'Ouest. Trois jours de concerts dans la magnifique ville de Saint-Louis.",
    banner_url:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
    category_id: "c2",
    category: sampleCategories[1],
    location: "Place Faidherbe",
    city: "Saint-Louis",
    starts_at: daysFromNow(25),
    ends_at: daysFromNow(27),
    capacity: 5000,
    price: 15000,
    ticket_type: "standard",
    status: "published",
    tickets_sold: 3100,
    created_at: "",
  },
  {
    id: "e3",
    slug: "dakar-tech-summit",
    organizer_id: "o3",
    title: "Dakar Tech Summit 2026",
    description:
      "La plus grande conférence tech d'Afrique francophone. Startups, investisseurs, et innovateurs réunis pour façonner l'avenir numérique.",
    banner_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    category_id: "c8",
    category: sampleCategories[7],
    location: "CICAD Diamniadio",
    city: "Dakar",
    starts_at: daysFromNow(40),
    ends_at: daysFromNow(41),
    capacity: 1500,
    price: 25000,
    ticket_type: "standard",
    status: "published",
    tickets_sold: 870,
    created_at: "",
  },
  {
    id: "e4",
    slug: "match-gala-teranga",
    organizer_id: "o1",
    title: "Match de Gala - Lions de la Teranga",
    description:
      "Venez supporter les Lions lors de ce match de gala caritatif au Stade Abdoulaye Wade. Une ambiance électrique vous attend !",
    banner_url:
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80",
    category_id: "c3",
    category: sampleCategories[2],
    location: "Stade Abdoulaye Wade",
    city: "Diamniadio",
    starts_at: daysFromNow(8, 17),
    ends_at: null,
    capacity: 50000,
    price: 5000,
    ticket_type: "standard",
    status: "published",
    tickets_sold: 21000,
    created_at: "",
  },
  {
    id: "e5",
    slug: "soiree-afrobeat-plage",
    organizer_id: "o2",
    title: "Soirée Afrobeat sur la Plage",
    description:
      "DJ sets, cocktails et coucher de soleil sur la plage de Ngor. La soirée la plus attendue de l'été dakarois.",
    banner_url:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
    category_id: "c5",
    category: sampleCategories[4],
    location: "Plage de Ngor",
    city: "Dakar",
    starts_at: daysFromNow(5, 21),
    ends_at: null,
    capacity: 800,
    price: 8000,
    ticket_type: "vip",
    status: "published",
    tickets_sold: 540,
    created_at: "",
  },
  {
    id: "e6",
    slug: "conference-entrepreneuriat-feminin",
    organizer_id: "o3",
    title: "Conférence Entrepreneuriat Féminin",
    description:
      "Une journée d'inspiration et de networking dédiée aux femmes entrepreneures du Sénégal. Ateliers, mentorat et témoignages.",
    banner_url:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
    category_id: "c4",
    category: sampleCategories[3],
    location: "King Fahd Palace",
    city: "Dakar",
    starts_at: daysFromNow(18, 9),
    ends_at: null,
    capacity: 600,
    price: 0,
    ticket_type: "gratuit",
    status: "published",
    tickets_sold: 410,
    created_at: "",
  },
];

export function getSampleEventBySlug(slug: string): Event | undefined {
  return sampleEvents.find((e) => e.slug === slug);
}
