'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const HERO_STATS = [
  { value: '24 Hours', label: 'Avg. Delivery' },
  { value: '4.9 / 5', label: 'Customer Rating' },
];

export function Hero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-[#07111C]"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(7,17,28,0.92) 0%, rgba(7,17,28,0.70) 50%, rgba(7,17,28,0.3) 100%), url(https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?auto=format&fit=crop&w=1800&q=82)',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07111C] to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-170px)] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold text-white shadow-brand-lg backdrop-blur animate-soft-pop">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Now available in your city
          </div>

          <h1
            className="max-w-2xl text-5xl font-extrabold leading-none text-white drop-shadow-sm sm:text-6xl lg:text-7xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Fresh Clothes, Delivered to Your Door
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 sm:text-xl">
            Skip the trips, skip the stress — we pick up, clean, and return within 24 hours. Same-day slots available.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#4EAEE5] px-7 py-3.5 text-base font-extrabold text-[#07111C] shadow-brand transition-all duration-200 hover:-translate-y-1 hover:bg-[#63BCEE] hover:shadow-lively sm:w-auto">
                Schedule Free Pickup
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a href="#pricing">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border-2 border-white/40 px-7 py-3.5 text-base font-extrabold text-white transition-all duration-200 hover:-translate-y-1 hover:bg-white/10 sm:w-auto">
                View Pricing
              </button>
            </a>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/90">
            {['No subscription needed', '500+ happy customers', 'Same-day slots available'].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4EAEE5]" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          {HERO_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className="lively-card rounded-[8px] border border-white/10 bg-white/5 p-4 text-white shadow-brand-lg backdrop-blur"
              style={{ animationDelay: `${index * 0.12}s` }}
            >
              <div
                className="text-3xl font-extrabold leading-none text-[#4EAEE5]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stat.value}
              </div>
              <p className="mt-2 text-sm font-medium text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
