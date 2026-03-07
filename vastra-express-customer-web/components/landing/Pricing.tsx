'use client';

import { useEffect, useState } from 'react';
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
      .catch(() => {/* show fallback */})
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
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full mb-3">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Simple, Fair Pricing
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            No hidden charges. What you see is what you pay. GST applicable.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                </div>
              ))
            : displayPricing.map((item) => {
                const display = SERVICE_DISPLAY[item.serviceType];
                if (!display) return null;
                const price = item.pricePerKg ?? item.basePrice ?? 0;

                return (
                  <div
                    key={item.serviceType}
                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="text-3xl mb-3">{display.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{display.label}</h3>
                    {item.description && (
                      <p className="text-xs text-gray-400 mb-3">{item.description}</p>
                    )}
                    <div className="mt-auto">
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{price}
                      </span>
                      <span className="text-gray-400 text-sm">{display.unit}</span>
                    </div>
                    {item.expressMultiplier && (
                      <p className="text-xs text-orange-500 mt-2 font-medium">
                        ⚡ Express: {item.expressMultiplier}× rate
                      </p>
                    )}
                  </div>
                );
              })}
        </div>

        {/* Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-3xl mx-auto">
          <h4 className="font-semibold text-blue-900 mb-3">Pricing Notes</h4>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">•</span>
              Wash & Fold / Wash & Iron are billed per kg (measured at pickup).
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">•</span>
              Dry Clean and Iron Only are billed per item at the facility.
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">•</span>
              Express service (24-hour turnaround) is available at 1.5× the standard rate.
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">•</span>
              All prices exclusive of GST (18%). Final bill shared after processing.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
