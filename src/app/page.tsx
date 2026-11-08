import { Hero } from "@/components/home/hero";
import { RecentEvents } from "@/components/home/recent-events";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaSection } from "@/components/home/cta";
import { Testimonials } from "@/components/home/testimonials";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { getRecentEvents, getUpcomingEvents } from "@/lib/data/events";
import { SITE, SUPPORT_PHONES } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.publicUrl}/#organization`,
      name: SITE.name,
      url: SITE.publicUrl,
      logo: `${SITE.publicUrl}/icon-512.png`,
      email: "kaypass26@gmail.com",
      telephone: SUPPORT_PHONES[0].label.replace(/\s/g, ""),
      areaServed: "SN",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.publicUrl}/#website`,
      name: SITE.name,
      url: SITE.publicUrl,
      inLanguage: "fr",
      publisher: { "@id": `${SITE.publicUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE.publicUrl}/explorer?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function HomePage() {
  const [recent, upcoming] = await Promise.all([
    getRecentEvents(6),
    getUpcomingEvents(5),
  ]);

  return (
    <>
      <JsonLd data={siteJsonLd} />
      <Hero events={upcoming} />
      <RecentEvents events={recent} />
      <HowItWorks />
      <Testimonials />
      <CtaSection />
    </>
  );
}
