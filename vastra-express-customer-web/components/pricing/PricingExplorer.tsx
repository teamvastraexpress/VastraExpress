'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import {
  DRY_CLEANING_TABS,
  POPULAR_SERVICE_ITEMS,
  PRICE_RANGE_OPTIONS,
  SERVICE_CATEGORIES,
  SERVICE_CATALOG_ITEMS,
  byPriceRange,
  bySearchQuery,
  categoryItems,
  tagBadgeVariant,
  tagLabel,
  type CatalogCategoryId,
  type DryCleaningTabId,
  type PriceRangeId,
  type ServiceCatalogItem,
} from '@/lib/serviceCatalog';
import { cn } from '@/lib/utils';

type CategoryFilterId = 'all' | CatalogCategoryId;

function isCategoryId(value: string | null): value is CatalogCategoryId {
  if (!value) return false;
  return SERVICE_CATEGORIES.some((category) => category.id === value);
}

function isPriceRange(value: string | null): value is PriceRangeId {
  if (!value) return false;
  return PRICE_RANGE_OPTIONS.some((option) => option.id === value);
}

function isDryTab(value: string | null): value is DryCleaningTabId {
  if (!value) return false;
  return DRY_CLEANING_TABS.some((tab) => tab.id === value);
}

function categoryResults(
  categoryId: CatalogCategoryId,
  items: ServiceCatalogItem[],
  dryCleaningTab: DryCleaningTabId,
): ServiceCatalogItem[] {
  let sectionItems =
    categoryId === 'premium-special'
      ? items.filter((item) => item.tags.includes('premium') || item.tags.includes('heavy'))
      : items.filter((item) => item.categoryId === categoryId);

  if (categoryId === 'dry-cleaning' && dryCleaningTab !== 'all') {
    sectionItems = sectionItems.filter((item) => item.dryCleaningTab === dryCleaningTab);
  }

  return sectionItems;
}

export function PricingExplorer() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterId>('all');
  const [priceRange, setPriceRange] = useState<PriceRangeId>('all');
  const [dryCleaningTab, setDryCleaningTab] = useState<DryCleaningTabId>('all');
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const range = searchParams.get('price');
    const dry = searchParams.get('dryTab');
    const item = searchParams.get('item');

    setQuery(q ?? '');
    setHighlightItemId(item ?? null);
    setCategoryFilter(isCategoryId(category) ? category : 'all');
    setPriceRange(isPriceRange(range) ? range : 'all');
    setDryCleaningTab(isDryTab(dry) ? dry : 'all');
  }, [searchParams]);

  const filteredItems = useMemo(() => {
    let items = SERVICE_CATALOG_ITEMS;

    if (categoryFilter !== 'all') {
      items = categoryItems(categoryFilter);
    }

    items = byPriceRange(items, priceRange);
    items = bySearchQuery(items, query);

    return items;
  }, [categoryFilter, priceRange, query]);

  const visibleCategories = useMemo(() => {
    if (categoryFilter === 'all') return SERVICE_CATEGORIES;
    return SERVICE_CATEGORIES.filter((category) => category.id === categoryFilter);
  }, [categoryFilter]);

  const totalVisibleCount = filteredItems.length;

  return (
    <section className="pb-20">
      <div className="bg-gradient-to-b from-[#E8F4FB] via-[#F0F8FF] to-transparent border-b border-[#A8D8F0]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#A8D8F0] px-4 py-1.5 text-xs font-semibold text-[#1A6FC4]">
              <Sparkles className="w-3.5 h-3.5" />
              Full Service Catalog
            </span>
            <h1
              className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
              style={{ color: '#1B2A3B', fontFamily: 'var(--font-heading)' }}
            >
              Find Any Item Price in Seconds
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#4A5A6B] leading-relaxed max-w-2xl">
              Browse by category, refine with filters, or search globally across all services. Dry cleaning is split into
              men, women, and children tabs for quick discovery.
            </p>
          </div>

          <Card className="mt-8 p-5 sm:p-6" variant="elevated">
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-4 items-end">
              <Input
                label="Search your item"
                placeholder="Type saree, sherwani, sofa, handbag..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                leftAddon={<Search className="w-4 h-4" />}
              />

              <Select
                label="Category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as CategoryFilterId)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...SERVICE_CATEGORIES.map((category) => ({
                    value: category.id,
                    label: category.label,
                  })),
                ]}
              />

              <Select
                label="Price range"
                value={priceRange}
                onChange={(event) => setPriceRange(event.target.value as PriceRangeId)}
                options={PRICE_RANGE_OPTIONS.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-[#4A5A6B]">
                <SlidersHorizontal className="w-4 h-4 text-[#1A6FC4]" />
                {totalVisibleCount} items match your filters
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-[#1A6FC4] hover:text-[#145DA0] transition-colors"
                onClick={() => {
                  setQuery('');
                  setCategoryFilter('all');
                  setPriceRange('all');
                  setDryCleaningTab('all');
                  setHighlightItemId(null);
                }}
              >
                Reset filters
              </button>
            </div>
          </Card>

          <div className="mt-6 rounded-2xl border border-[#A8D8F0] bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1B2A3B] mb-3">
              <ShieldCheck className="w-4 h-4 text-[#1A6FC4]" />
              Popular picks
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SERVICE_ITEMS.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#A8D8F0] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1A6FC4] hover:bg-[#E8F4FB] transition-colors"
                  onClick={() => {
                    setQuery(item.name);
                    setCategoryFilter(item.categoryId);
                    setHighlightItemId(item.id);
                    if (item.dryCleaningTab) {
                      setDryCleaningTab(item.dryCleaningTab);
                    }
                  }}
                >
                  {item.name}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-4">
        {visibleCategories.map((category, categoryIndex) => {
          const sectionItems = categoryResults(category.id, filteredItems, dryCleaningTab);
          if (sectionItems.length === 0) return null;

          return (
            <details
              key={category.id}
              className="group rounded-2xl border border-[#A8D8F0] bg-white overflow-hidden"
              open={categoryIndex === 0 || query.length > 0 || categoryFilter !== 'all'}
            >
              <summary className="list-none cursor-pointer px-5 sm:px-6 py-5 border-b border-[#E8F4FB]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F4FB] text-[#1A6FC4] text-sm font-bold">
                        {category.icon}
                      </span>
                      <h2
                        className="text-xl sm:text-2xl font-bold"
                        style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                      >
                        {category.label}
                      </h2>
                      <Badge variant="sky">{sectionItems.length} items</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[#4A5A6B] max-w-3xl">{category.description}</p>
                  </div>
                  <ChevronDown className="h-5 w-5 text-[#1A6FC4] transition-transform group-open:rotate-180" />
                </div>
              </summary>

              <div className="px-5 sm:px-6 py-5">
                {category.id === 'dry-cleaning' && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {DRY_CLEANING_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={cn(
                          'rounded-full px-3.5 py-1.5 text-sm font-semibold border transition-colors',
                          dryCleaningTab === tab.id
                            ? 'bg-[#1A6FC4] text-white border-[#1A6FC4]'
                            : 'bg-white text-[#4A5A6B] border-[#A8D8F0] hover:bg-[#E8F4FB]',
                        )}
                        onClick={() => setDryCleaningTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {sectionItems.map((item) => {
                    const isHighlighted = highlightItemId === item.id;

                    return (
                      <article
                        key={item.id}
                        id={item.id}
                        className={cn(
                          'rounded-xl border p-4 transition-all',
                          isHighlighted
                            ? 'border-[#1A6FC4] bg-[#F0F8FF] shadow-brand'
                            : 'border-[#E8F4FB] bg-white hover:border-[#A8D8F0] hover:bg-[#FCFEFF]',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold text-[#1B2A3B]" style={{ fontFamily: 'var(--font-heading)' }}>
                              {item.name}
                            </h3>
                            <p className="text-xs text-[#8FA3B1] mt-0.5">
                              {item.aliases.slice(0, 2).join(' / ')}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold text-[#1A6FC4]" style={{ fontFamily: 'var(--font-display)' }}>
                              {item.priceLabel}
                            </p>
                            <p className="text-xs text-[#4A5A6B]">{item.unitLabel}</p>
                          </div>
                        </div>

                        {item.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <Badge key={`${item.id}-${tag}`} variant={tagBadgeVariant(tag)} size="sm">
                                {tagLabel(tag)}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <p className="mt-3 text-xs text-[#8FA3B1]">Client rate input: {item.sourceRateLabels.join(' | ')}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </details>
          );
        })}

        {totalVisibleCount === 0 && (
          <Card className="p-8 text-center" variant="outline">
            <h3 className="text-xl font-bold text-[#1B2A3B]" style={{ fontFamily: 'var(--font-heading)' }}>
              No matching items found
            </h3>
            <p className="mt-2 text-sm text-[#4A5A6B]">
              Try a simpler keyword, switch to All Categories, or reset your price range.
            </p>
            <div className="mt-5">
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setCategoryFilter('all');
                  setPriceRange('all');
                  setDryCleaningTab('all');
                }}
              >
                Reset and Explore Again
              </Button>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
