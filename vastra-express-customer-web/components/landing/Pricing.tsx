'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface PricingItem {
  serviceType: string;
  pricePerKg?: number | null;
  basePrice?: number | null;
  expressMultiplier?: number | null;
  description?: string | null;
}

const SERVICE_DISPLAY: Record<string, { label: string; icon: string; unit: string }> = {
  WASH_FOLD: { label: 'Wash & Fold', icon: '🫧', unit: '/kg' },
  WASH_IRON: { label: 'Wash & Iron', icon: '👔', unit: '/kg' },
  DRY_CLEAN: { label: 'Dry Clean', icon: '✨', unit: '/item' },
  IRON_ONLY: { label: 'Iron Only', icon: '🔥', unit: '/item' },
};

// 3-tier plan model per content strategy
const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Per-item pricing',
    target: 'Casual users',
    price: '₹25',
    priceUnit: 'per item onwards',
    highlight: false,
    features: [
      'Iron Only service',
      'Shoe Cleaning',
      'Pay per item — no commitment',
      'Standard 48hr turnaround',
      'Doorstep pickup & delivery',
    ],
    cta: 'Get Started',
  },
  {
    id: 'regular',
    name: 'Regular',
    tagline: 'Weekly bundle',
    target: 'Most popular',
    price: '₹49',
    priceUnit: 'per kg onwards',
    highlight: true,
    features: [
      'Wash & Fold + Wash & Iron',
      'Weekly pickup scheduling',
      'Same-day for orders before 10am',
      '24-hour express turnaround',
      'Live order tracking',
      'Dedicated support',
    ],
    cta: 'Book Now',
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Monthly subscription',
    target: 'Priority service',
    price: '₹999',
    priceUnit: 'per month',
    highlight: false,
    features: [
      'All services included',
      'Monthly subscription, priority slots',
      'Free pickup — no minimum',
      'Dry cleaning included',
      'Fabric-Safe Guarantee',
      'Dedicated account manager',
    ],
    cta: 'Subscribe',
  },
];

export function Pricing() {
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/billing/pricing')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setPricing(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fallback: PricingItem[] = [
    { serviceType: 'WASH_FOLD', pricePerKg: 49, expressMultiplier: 1.5 },
    { serviceType: 'WASH_IRON', pricePerKg: 69, expressMultiplier: 1.5 },
    { serviceType: 'DRY_CLEAN', basePrice: 149, expressMultiplier: 1.5 },
    { serviceType: 'IRON_ONLY', basePrice: 25, expressMultiplier: 1.5 },
  ];

  const displayPricing = pricing.length > 0 ? pricing : fallback;

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{ background: '#E8F4FB', color: '#1A6FC4' }}
          >
            Transparent Pricing
          </span>
          <h2
            className="mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 700, color: '#1A6FC4' }}
          >
            Simple, Fair Pricing
          </h2>
          <p className="max-w-xl mx-auto" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4A5A6B' }}>
            No hidden charges. Quoted price is final. Choose the plan that fits your laundry routine.
          </p>
        </div>

        {/* 3-tier plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan, idx) => (
            <div
              key={plan.id}
              className="relative rounded-2xl p-8 flex flex-col transition-all duration-200 hover:-translate-y-1 animate-fade-in-up"
              style={{
                animationDelay: `${idx * 0.1}s`,
                background: plan.highlight ? '#1A6FC4' : 'white',
                border: plan.highlight ? 'none' : '1px solid #A8D8F0',
                boxShadow: plan.highlight
                  ? '0 8px 32px rgba(26,111,196,0.35)'
                  : '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F5A623] text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                  ⭐ Most Popular
                </div>
              )}

              <div className="mb-6">
                <p
                  className="text-xs uppercase tracking-wider font-semibold mb-1"
                  style={{ color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#8FA3B1' }}
                >
                  {plan.target}
                </p>
                <h3
                  className="text-2xl font-bold mb-1"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: plan.highlight ? 'white' : '#1B2A3B',
                  }}
                >
                  {plan.name}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: plan.highlight ? 'rgba(255,255,255,0.75)' : '#4A5A6B' }}
                >
                  {plan.tagline}
                </p>
              </div>

              <div className="mb-6">
                <span
                  className="text-4xl font-extrabold tracking-tight"
                  style={{ color: plan.highlight ? 'white' : '#1A6FC4', fontFamily: 'var(--font-display)' }}
                >
                  {plan.price}
                </span>
                <span
                  className="text-sm ml-1.5"
                  style={{ color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#4A5A6B' }}
                >
                  {plan.priceUnit}
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span style={{ color: plan.highlight ? '#A8D8F0' : '#1A6FC4', marginTop: '2px' }}>✓</span>
                    <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.88)' : '#4A5A6B' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login">
                <button
                  className="w-full font-semibold py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 text-sm"
                  style={{
                    background: plan.highlight ? 'white' : '#1A6FC4',
                    color: plan.highlight ? '#1A6FC4' : 'white',
                    boxShadow: plan.highlight ? 'none' : '0 4px 16px rgba(26,111,196,0.30)',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  {plan.cta} →
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* Per-item rates from API */}
        <div className="mb-12">
          <h3
            className="text-center mb-8"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: '#1B2A3B' }}
          >
            Individual Service Rates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-8 bg-gray-200 rounded w-1/2" />
                  </div>
                ))
              : displayPricing.map((item, idx) => {
                  const display = SERVICE_DISPLAY[item.serviceType];
                  if (!display) return null;
                  const price = item.pricePerKg ?? item.basePrice ?? 0;
                  return (
                    <div
                      key={item.serviceType}
                      className="bg-white rounded-2xl p-6 hover:-translate-y-1 transition-all duration-200 animate-fade-in-up group"
                      style={{
                        border: '1px solid #A8D8F0',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        animationDelay: `${idx * 0.1}s`,
                      }}
                    >
                      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{display.icon}</div>
                      <h4
                        className="font-bold mb-1"
                        style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', color: '#1B2A3B' }}
                      >
                        {display.label}
                      </h4>
                      {item.description && (
                        <p className="text-xs mb-3" style={{ color: '#8FA3B1' }}>{item.description}</p>
                      )}
                      <div className="mt-auto">
                        <span className="text-3xl font-bold" style={{ color: '#1A6FC4', fontFamily: 'var(--font-display)' }}>₹{price}</span>
                        <span className="text-sm ml-1" style={{ color: '#4A5A6B' }}>{display.unit}</span>
                      </div>
                      {item.expressMultiplier && (
                        <p className="text-xs font-semibold bg-orange-50 text-orange-600 px-2.5 py-1.5 rounded-lg inline-block mt-3">
                          ⚡ Express: {item.expressMultiplier}× rate
                        </p>
                      )}
                    </div>
                  );
                })}
          </div>
        </div>

        {/* Notes box */}
        <div
          className="rounded-2xl p-8 max-w-3xl mx-auto mb-12"
          style={{ background: '#E8F4FB', border: '1px solid #A8D8F0' }}
        >
          <h4 className="font-bold mb-4 text-lg" style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}>
            💡 Pricing Notes
          </h4>
          <ul className="space-y-3">
            {[
              { bold: 'Wash & Fold / Wash & Iron', text: 'Billed per kilogram — weighed at pickup.' },
              { bold: 'Dry Clean & Iron Only', text: 'Billed per item after facility processing.' },
              { bold: 'Express Service', text: '24-hour turnaround available at 1.5× standard rate.' },
              { bold: 'No hidden charges', text: 'Quoted price is final. GST shown clearly on your bill.' },
            ].map(({ bold, text }) => (
              <li key={bold} className="flex items-start gap-3 text-sm" style={{ color: '#4A5A6B' }}>
                <span className="font-bold flex-shrink-0 mt-0.5" style={{ color: '#1A6FC4' }}>✓</span>
                <span><strong style={{ color: '#1B2A3B' }}>{bold}:</strong> {text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="mb-5" style={{ color: '#4A5A6B', fontFamily: 'var(--font-body)' }}>
            Ready to experience premium laundry care?
          </p>
          <Link href="/login">
            <button
              className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: '#1A6FC4',
                color: 'white',
                boxShadow: '0 4px 16px rgba(26,111,196,0.30)',
                fontFamily: 'var(--font-ui)',
                fontSize: '15px',
              }}
            >
              Book Your First Pickup →
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
