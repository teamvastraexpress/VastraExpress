"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Flame,
  Gem,
  type LucideIcon,
  ShieldCheck,
  Shirt,
  Sofa,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import {
  POPULAR_SERVICE_ITEMS,
  SERVICE_CATEGORIES,
  categoryItems,
  type CatalogCategoryId,
} from '@/lib/serviceCatalog';

const CATEGORY_ICONS: Record<CatalogCategoryId, LucideIcon> = {
  laundry: Shirt,
  'dry-cleaning': Sparkles,
  'steam-ironing': Flame,
  'bags-shoes': BriefcaseBusiness,
  'home-furnishing': Sofa,
  'cleaning-sanitization': ShieldCheck,
  'premium-special': Gem,
};

function buildPricingHref(categoryId: CatalogCategoryId, itemId?: string, query?: string): string {
  const params = new URLSearchParams({ category: categoryId });
  if (itemId) params.set('item', itemId);
  if (query) params.set('q', query);
  return `/pricing?${params.toString()}`;
}

export function Services() {
  const [quickCategory, setQuickCategory] = useState<CatalogCategoryId>('laundry');
  const quickItems = useMemo(() => categoryItems(quickCategory), [quickCategory]);
  const [quickItemId, setQuickItemId] = useState<string>('');

  useEffect(() => {
    setQuickItemId(quickItems[0]?.id ?? '');
  }, [quickItems]);

  const selectedQuickItem = useMemo(
    () => quickItems.find((item) => item.id === quickItemId),
    [quickItems, quickItemId],
  );

  return (
    <section id="services" className="py-24" style={{ background: '#F0F8FF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span
            className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{ background: '#A8D8F0', color: '#1A6FC4' }}
          >
            Our Services
          </span>
          <h2
            className="mb-4 tracking-tight"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '32px',
              fontWeight: 700,
              color: '#1A6FC4',
            }}
          >
            Explore by Category, Not by Long List
          </h2>
          <p
            className="max-w-2xl mx-auto"
            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4A5A6B' }}
          >
            Start with category cards, then jump to full pricing with search, tabs, and filters. Fast to browse,
            easy to compare.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          {SERVICE_CATEGORIES.map((category, idx) => {
            const Icon = CATEGORY_ICONS[category.id];
            const href = buildPricingHref(category.id);

            return (
              <article
                key={category.id}
                className="rounded-2xl border border-[#A8D8F0] bg-white p-6 hover:shadow-brand-lg transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#E8F4FB] text-[#1A6FC4] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  {category.id === 'premium-special' && <Badge variant="warning">Premium</Badge>}
                </div>

                <h3 className="text-xl font-bold text-[#1B2A3B] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {category.label}
                </h3>
                <p className="text-sm text-[#4A5A6B] leading-relaxed mb-4">{category.description}</p>

                <ul className="space-y-2 mb-5">
                  {category.sampleItems.map((item) => (
                    <li
                      key={`${category.id}-${item.label}`}
                      className="flex items-center justify-between gap-3 text-sm border-b border-[#E8F4FB] pb-2"
                    >
                      <span className="text-[#1B2A3B] font-medium">{item.label}</span>
                      <span className="text-[#1A6FC4] font-semibold whitespace-nowrap">{item.priceLabel}</span>
                    </li>
                  ))}
                </ul>

                <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A6FC4] hover:text-[#145DA0]">
                  View Full Pricing
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#A8D8F0] bg-white p-5 sm:p-6 mb-8">
          <div className="flex items-center gap-2 mb-3 text-[#1B2A3B] font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-[#1A6FC4]" />
            Popular Items
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SERVICE_ITEMS.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={buildPricingHref(item.categoryId, item.id, item.name)}
                className="inline-flex items-center gap-2 rounded-full border border-[#A8D8F0] px-3 py-1.5 text-sm font-semibold text-[#1A6FC4] hover:bg-[#E8F4FB] transition-colors"
              >
                {item.name}
                <span className="text-xs text-[#4A5A6B]">{item.priceLabel}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#A8D8F0] bg-gradient-to-r from-white to-[#F7FBFF] p-5 sm:p-6">
          <h3 className="text-xl font-bold text-[#1B2A3B] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Select Your Item
          </h3>
          <p className="text-sm text-[#4A5A6B] mb-5">Choose category and item to see price instantly.</p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <Select
              label="Category"
              value={quickCategory}
              onChange={(event) => setQuickCategory(event.target.value as CatalogCategoryId)}
              options={SERVICE_CATEGORIES.map((category) => ({
                value: category.id,
                label: category.label,
              }))}
            />

            <Select
              label="Item"
              value={quickItemId}
              onChange={(event) => setQuickItemId(event.target.value)}
              options={quickItems.map((item) => ({
                value: item.id,
                label: `${item.name} (${item.priceLabel})`,
              }))}
            />

            <Link
              href={buildPricingHref(quickCategory, selectedQuickItem?.id, selectedQuickItem?.name)}
              className="md:pb-0.5"
            >
              <Button className="w-full md:w-auto" size="lg">
                See Full Pricing
              </Button>
            </Link>
          </div>

          {selectedQuickItem && (
            <div className="mt-5 rounded-xl border border-[#A8D8F0] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#8FA3B1]">Selected item</p>
                <p className="font-bold text-[#1B2A3B]" style={{ fontFamily: 'var(--font-heading)' }}>
                  {selectedQuickItem.name}
                </p>
              </div>
              <p className="text-lg font-bold text-[#1A6FC4]" style={{ fontFamily: 'var(--font-display)' }}>
                {selectedQuickItem.priceLabel} {selectedQuickItem.unitLabel}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
