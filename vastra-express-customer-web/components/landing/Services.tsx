'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Flame,
  Gem,
  ShieldCheck,
  Shirt,
  Sofa,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
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

  const selectedQuickItem = useMemo(
    () => quickItems.find((item) => item.id === quickItemId) ?? quickItems[0],
    [quickItems, quickItemId],
  );

  return (
    <section id="services" className="bg-[#0C1A2F] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="kicker-chip border border-white/10 bg-white/5 text-[#4EAEE5]">
            Our Services
          </span>
          <h2
            className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Explore by Category, Not by Long List
          </h2>
          <p className="mt-5 text-base leading-8 text-white/80">
            Start with category cards, then jump to full pricing with search, tabs, and filters. Fast to browse,
            easy to compare.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id];
            const href = buildPricingHref(category.id);

            return (
              <article
                key={category.id}
                className="lively-card group flex h-full flex-col border border-white/10 bg-[#07111C] p-5 shadow-sm transition-all hover:border-[#4EAEE5]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="icon-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-white/5 text-[#4EAEE5]">
                    <Icon className="h-5 w-5" />
                  </span>
                  {category.id === 'premium-special' && (
                    <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold text-[#92400E]">
                      Premium
                    </span>
                  )}
                </div>

                <h3
                  className="mt-5 text-xl font-bold text-white"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {category.label}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-7 text-white/70">{category.description}</p>

                <div className="mt-5 space-y-2">
                  {category.sampleItems.map((item) => (
                    <div
                      key={`${category.id}-${item.label}`}
                      className="flex items-center justify-between gap-3 rounded-[8px] bg-white/5 px-3 py-2 text-sm transition-colors group-hover:bg-white/10"
                    >
                      <span className="font-semibold text-white/90">{item.label}</span>
                      <span className="shrink-0 font-bold text-[#4EAEE5]">{item.priceLabel}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#4EAEE5] transition-colors hover:text-[#63BCEE]"
                >
                  View Full Pricing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 rounded-[8px] border border-white/10 bg-[#07111C] p-5 shadow-lively lg:grid-cols-[0.95fr_1.05fr] lg:p-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#4EAEE5]">
              <Sparkles className="h-4 w-4" />
              Popular Items
            </div>
            <h3
              className="text-2xl font-extrabold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Select Your Item
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Choose category and item to see price instantly.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {POPULAR_SERVICE_ITEMS.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={buildPricingHref(item.categoryId, item.id, item.name)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#4EAEE5] transition-colors hover:bg-white/10"
                >
                  {item.name}
                  <span className="text-white/60">{item.priceLabel}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-white/10 bg-white/5 p-4 text-white">
            <div className="grid gap-4 md:grid-cols-2">
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
                value={selectedQuickItem?.id ?? ''}
                onChange={(event) => setQuickItemId(event.target.value)}
                options={quickItems.map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.priceLabel})`,
                }))}
              />
            </div>

            {selectedQuickItem && (
              <div className="mt-4 flex flex-col gap-3 rounded-[8px] border border-white/10 bg-[#07111C] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Selected item</p>
                  <p className="mt-1 font-bold text-white">{selectedQuickItem.name}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p
                    className="text-2xl font-extrabold text-[#4EAEE5]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {selectedQuickItem.priceLabel}
                  </p>
                  <p className="text-xs font-medium text-white/60">{selectedQuickItem.unitLabel}</p>
                </div>
              </div>
            )}

            <Link href={buildPricingHref(quickCategory, selectedQuickItem?.id, selectedQuickItem?.name)}>
              <Button className="mt-4 w-full rounded-[8px]" size="lg">
                See Full Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
