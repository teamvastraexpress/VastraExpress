import { Suspense } from 'react';
import { Footer } from '@/components/landing/Footer';
import { PricingExplorer } from '@/components/pricing/PricingExplorer';
import { Navbar } from '@/components/layout/Navbar';

export default function FullPricingPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#07111C]">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="rounded-2xl border border-white/10 bg-[#07111C] p-8 text-center text-white/70">
                Loading pricing catalog...
              </div>
            </div>
          }
        >
          <PricingExplorer />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
