import { Hero } from "@/components/home/hero";
import { RecentEvents } from "@/components/home/recent-events";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaSection } from "@/components/home/cta";
import { Testimonials } from "@/components/home/testimonials";
import { getRecentEvents } from "@/lib/data/events";
import { isEventPast } from "@/lib/format";

export default async function HomePage() {
  const recent = await getRecentEvents(6);
  const featured =
    recent
      .filter((e) => !isEventPast(e))
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      )[0] ?? null;

  return (
    <>
      <Hero featured={featured} />
      <RecentEvents events={recent} />
      <HowItWorks />
      <Testimonials />
      <CtaSection />
    </>
  );
}
