import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getPublishedEvents } from "@/lib/data/events";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getPublishedEvents();
  const now = Date.now();

  const pages: MetadataRoute.Sitemap = [
    { url: SITE.publicUrl, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.publicUrl}/explorer`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.publicUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.publicUrl}/contact`, changeFrequency: "yearly", priority: 0.4 },
  ];

  const eventPages: MetadataRoute.Sitemap = events.map((event) => {
    const upcoming = new Date(event.ends_at ?? event.starts_at).getTime() >= now;
    return {
      url: `${SITE.publicUrl}/evenements/${event.slug}`,
      lastModified: event.created_at,
      changeFrequency: upcoming ? "daily" : "yearly",
      priority: upcoming ? 0.8 : 0.3,
      ...(event.banner_url ? { images: [event.banner_url] } : {}),
    };
  });

  return [...pages, ...eventPages];
}
