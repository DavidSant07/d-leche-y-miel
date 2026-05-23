import { HeroSection } from '../components/home/HeroSection';
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection';
import { FoundersSection } from '../components/home/FoundersSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturedProductsSection />
      <FoundersSection />
      <TestimonialsSection />
    </div>
  );
}
