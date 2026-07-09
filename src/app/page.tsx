import { Hero } from "@/components/home/hero";
import { PopularEvents } from "@/components/home/popular-events";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaSection } from "@/components/home/cta";
import { Testimonials } from "@/components/home/testimonials";
import { getPopularEvents } from "@/lib/data/events";

export default async function HomePage() {
  const popular = await getPopularEvents(6);

  return (
    <>
      <Hero />
      <PopularEvents events={popular} />
      <HowItWorks />
      <Testimonials />
      <CtaSection />
    </>
  );
}
