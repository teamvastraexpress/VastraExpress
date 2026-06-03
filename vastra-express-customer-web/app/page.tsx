import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { Services } from '@/components/landing/Services';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Pricing } from '@/components/landing/Pricing';
import { Testimonials } from '@/components/landing/Testimonials';
import { Gallery } from '@/components/landing/Gallery';
import { WhyUs } from '@/components/landing/WhyUs';
import { StoreLocationsMap } from '@/components/landing/StoreLocationsMap';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <StoreLocationsMap />
        <Services />
        <HowItWorks />
        <Pricing />
        <Gallery />
        <Testimonials />
        <WhyUs />
      </main>
      <Footer />
    </>
  );
}
