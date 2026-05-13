import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const TRUST_FOOTER = ['No subscription required', 'Cancel anytime', 'Instant refund policy'];

export function CTABanner() {
  return (
    <section
      className="relative isolate overflow-hidden py-20 md:py-24 bg-[#07111C]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#07111C] via-[#0C1A2F] to-[#07111C]" />


      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] bg-white/[0.03] p-8 text-center backdrop-blur sm:p-10 lg:p-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-4 py-2 text-sm font-extrabold text-[#4EAEE5] animate-soft-pop">
            <span className="h-2 w-2 rounded-full bg-[#4EAEE5]" />
            Limited slots today — book yours before they fill
          </span>

          <h2
            className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            First order? Get 20% off your pickup.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/80">
            No code needed. Book your pickup for tomorrow and save on all services.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#4EAEE5] px-8 py-3.5 text-base font-extrabold text-[#07111C] shadow-brand transition-all duration-200 hover:-translate-y-1 hover:bg-[#63BCEE] hover:shadow-lively sm:w-auto">
                Book Your Pickup Now
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a href="#services">
              <button className="inline-flex w-full items-center justify-center rounded-[8px] bg-white/[0.05] px-8 py-3.5 text-base font-extrabold text-[#4EAEE5] transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.1] sm:w-auto">
                Explore Services
              </button>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {TRUST_FOOTER.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-white/70"
              >
                <CheckCircle2 className="h-4 w-4 text-[#4EAEE5]" />
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
