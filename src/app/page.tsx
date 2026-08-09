import { Hero } from "@/components/home/hero";
import { RecentEvents } from "@/components/home/recent-events";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaSection } from "@/components/home/cta";
import { Testimonials } from "@/components/home/testimonials";
import { getRecentEvents } from "@/lib/data/events";

export default async function HomePage() {
  const recent = await getRecentEvents(6);

  return (
    <>
      <Hero />
      <RecentEvents events={recent} />
      <HowItWorks />
      <Testimonials />
      <CtaSection />
    </>
  );
}
