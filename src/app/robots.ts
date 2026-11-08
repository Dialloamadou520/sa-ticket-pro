import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/profil",
        "/controle",
        "/scanner",
        "/verifier",
        "/paiement",
        "/api",
        "/evenements/*/achat",
      ],
    },
    sitemap: `${SITE.publicUrl}/sitemap.xml`,
    host: SITE.publicUrl,
  };
}
