import { Hero } from "@/components/home/hero";
import { RecentEvents } from "@/components/home/recent-events";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaSection } from "@/components/home/cta";
import { Testimonials } from "@/components/home/testimonials";
import { getRecentEvents, getUpcomingEvents } from "@/lib/data/events";

export default async function HomePage() {
  const [recent, upcoming] = await Promise.all([
    getRecentEvents(6),
    getUpcomingEvents(5),
  ]);

  return (
    <>
      <Hero events={upcoming} />
      <RecentEvents events={recent} />
      <HowItWorks />
      <Testimonials />
      <CtaSection />
    </>
  );
}
