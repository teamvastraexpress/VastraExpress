import { Suspense } from 'react';
import { Footer } from '@/components/landing/Footer';
import { PricingExplorer } from '@/components/pricing/PricingExplorer';
import { Navbar } from '@/components/layout/Navbar';

export default function FullPricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="rounded-2xl border border-[#A8D8F0] bg-white p-8 text-center text-[#4A5A6B]">
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
