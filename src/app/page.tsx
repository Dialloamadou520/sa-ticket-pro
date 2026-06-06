import { Hero } from "@/components/home/hero";
import { CategoriesSection } from "@/components/home/categories";
import { PopularEvents } from "@/components/home/popular-events";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaSection } from "@/components/home/cta";
import { Testimonials } from "@/components/home/testimonials";
import { getCategories, getPopularEvents } from "@/lib/data/events";

export default async function HomePage() {
  const [categories, popular] = await Promise.all([
    getCategories(),
    getPopularEvents(6),
  ]);

  return (
    <>
      <Hero />
      <CategoriesSection categories={categories} />
      <PopularEvents events={popular} />
      <HowItWorks />
      <Testimonials />
      <CtaSection />
    </>
  );
}
