'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Calculator,
  ChevronDown,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
import { cn, formatCurrency } from '@/lib/utils';

type CategoryFilterId = 'all' | CatalogCategoryId;

type CalculatorLineItem = {
  id: string;
  name: string;
  unitLabel: string;
  rate: number;
  quantity: number;
};

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

  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterId>(() => {
    const category = searchParams.get('category');
    return isCategoryId(category) ? category : 'all';
  });
  const [priceRange, setPriceRange] = useState<PriceRangeId>(() => {
    const range = searchParams.get('price');
    return isPriceRange(range) ? range : 'all';
  });
  const [dryCleaningTab, setDryCleaningTab] = useState<DryCleaningTabId>(() => {
    const dry = searchParams.get('dryTab');
    return isDryTab(dry) ? dry : 'all';
  });
  const [highlightItemId, setHighlightItemId] = useState<string | null>(() => searchParams.get('item') ?? null);
  const [calculatorQuery, setCalculatorQuery] = useState('');
  const [calculatorItems, setCalculatorItems] = useState<CalculatorLineItem[]>([]);
  const calculatorSectionRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);

  const scrollToCalculator = () => {
    calculatorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const shouldFocusCalculator =
      searchParams.get('calc') === '1' || searchParams.get('calculator') === '1';

    if (shouldFocusCalculator && !hasAutoScrolledRef.current) {
      hasAutoScrolledRef.current = true;
      requestAnimationFrame(() => {
        calculatorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [searchParams]);

  const calculatorMatches = useMemo(() => {
    const normalized = calculatorQuery.trim();
    if (!normalized) return POPULAR_SERVICE_ITEMS;
    return bySearchQuery(SERVICE_CATALOG_ITEMS, normalized).slice(0, 12);
  }, [calculatorQuery]);

  const calculatorTotal = useMemo(
    () => calculatorItems.reduce((sum, line) => sum + line.rate * line.quantity, 0),
    [calculatorItems],
  );

  const addCalculatorItem = (item: ServiceCatalogItem) => {
    setCalculatorItems((prev) => {
      const existing = prev.find((line) => line.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.id === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          unitLabel: item.unitLabel,
          rate: item.minPrice,
          quantity: 1,
        },
      ];
    });
  };

  const updateCalculatorQuantity = (id: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setCalculatorItems((prev) => prev.filter((line) => line.id !== id));
      return;
    }
    setCalculatorItems((prev) =>
      prev.map((line) => (line.id === id ? { ...line, quantity } : line)),
    );
  };

  const unitDisplay = (unitLabel: string) => {
    const trimmed = unitLabel.startsWith('/') ? unitLabel.slice(1) : unitLabel;
    return trimmed ? `per ${trimmed}` : 'per item';
  };

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
    <section className="bg-[#07111C] pb-20">
      <div className="bg-gradient-to-b from-[#07111C] via-[#0C1A2F] to-[#07111C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold text-[#4EAEE5]">
              <Sparkles className="w-3.5 h-3.5" />
              Full Service Catalog
            </span>
            <h1
              className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Find Any Item Price in Seconds
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl">
              Browse by category, refine with filters, or search globally across all services. Dry cleaning is split into
              men, women, and children tabs for quick discovery.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-[#1B2B40] bg-[#0B1726] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:p-6">
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
              <div className="flex items-center gap-2 text-sm text-white/70">
                <SlidersHorizontal className="w-4 h-4 text-[#4EAEE5]" />
                {totalVisibleCount} items match your filters
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-[#4EAEE5] hover:text-[#63BCEE] transition-colors"
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
          </div>

          <div className="mt-4 rounded-2xl border border-[#1B2B40] bg-[#0B1726] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.2)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Want a quick estimate?
                </p>
                <p className="text-xs mt-1 text-white/60" style={{ fontFamily: 'var(--font-body)' }}>
                  Build a tentative bill with your item quantities.
                </p>
              </div>
              <Button
                variant="outline"
                leftIcon={<Calculator className="w-4 h-4" />}
                onClick={scrollToCalculator}
              >
                Calculate your bill
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#1B2B40] bg-[#0B1726] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.2)] sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <ShieldCheck className="w-4 h-4 text-[#4EAEE5]" />
              Popular picks
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SERVICE_ITEMS.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#1B2B40] bg-[#101D2D] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#4EAEE5] hover:bg-[#132235] transition-colors"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <div className="space-y-4">
            {visibleCategories.map((category, categoryIndex) => {
              const sectionItems = categoryResults(category.id, filteredItems, dryCleaningTab);
              if (sectionItems.length === 0) return null;

              return (
                <details
                  key={category.id}
                  className="group rounded-2xl border border-[#1B2B40] bg-[#0B1726] overflow-hidden transition-all"
                  open={categoryIndex === 0 || query.length > 0 || categoryFilter !== 'all'}
                >
                  <summary className="list-none cursor-pointer px-5 sm:px-6 py-5 hover:bg-[#101D2D] transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#1B2B40] bg-[#101D2D] text-sm font-bold text-[#4EAEE5]">
                            {category.icon}
                          </span>
                          <h2
                            className="text-xl sm:text-2xl font-bold text-white"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            {category.label}
                          </h2>
                          <Badge variant="sky">{sectionItems.length} items</Badge>
                        </div>
                        <p className="mt-2 text-sm text-white/70 max-w-3xl">{category.description}</p>
                      </div>
                      <ChevronDown className="h-5 w-5 text-[#4EAEE5] transition-transform group-open:rotate-180" />
                    </div>
                  </summary>

                  <div className="px-5 sm:px-6 py-5 bg-[#091420]">
                    {category.id === 'dry-cleaning' && (
                      <div className="mb-5 flex flex-wrap gap-2">
                        {DRY_CLEANING_TABS.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            className={cn(
                              'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                              dryCleaningTab === tab.id
                                ? 'bg-[#4EAEE5] text-[#07111C]'
                                : 'bg-[#101D2D] text-white/80 hover:bg-[#132235]',
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
                            role="button"
                            tabIndex={0}
                            aria-label={`Add ${item.name} to calculator`}
                            onClick={() => addCalculatorItem(item)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                addCalculatorItem(item);
                              }
                            }}
                            className={cn(
                              'rounded-xl p-4 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4EAEE5]/40',
                              isHighlighted
                                ? 'bg-[#4EAEE5]/15 shadow-brand'
                                : 'bg-[#101D2D] hover:bg-[#132235]',
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                                  {item.name}
                                </h3>
                                <p className="text-xs text-white/50 mt-0.5">
                                  {item.aliases.slice(0, 2).join(' / ')}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-xl font-bold text-[#4EAEE5]" style={{ fontFamily: 'var(--font-display)' }}>
                                  {item.priceLabel}
                                </p>
                                <p className="text-xs text-white/60">{item.unitLabel}</p>
                                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#4EAEE5]">
                                  <Plus className="w-3 h-3" /> Add
                                </span>
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

                            <p className="mt-3 text-xs text-white/40">Client rate input: {item.sourceRateLabels.join(' | ')}</p>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}

            {totalVisibleCount === 0 && (
              <div className="rounded-2xl border border-[#1B2B40] bg-[#0B1726] p-8 text-center">
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  No matching items found
                </h3>
                <p className="mt-2 text-sm text-white/70">
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
              </div>
            )}
          </div>

          <aside
            ref={calculatorSectionRef}
            id="bill-calculator"
            className="lg:sticky lg:top-24"
          >
            <div className="rounded-2xl border border-[#1B2B40] bg-[#0B1726] overflow-hidden shadow-[0_18px_48px_rgba(0,0,0,0.2)]">
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Calculate your bill
                  </h2>
                  <p className="text-xs mt-1 text-white/60">
                    Base-rate estimate for standard service.
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 space-y-5 max-h-none lg:max-h-[calc(100vh-240px)] overflow-y-auto">
                <div>
                  <Input
                    label="Search items"
                    placeholder="Type shirt, saree, blanket..."
                    value={calculatorQuery}
                    onChange={(event) => setCalculatorQuery(event.target.value)}
                    leftAddon={<Search className="w-4 h-4" />}
                  />

                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {calculatorMatches.length === 0 ? (
                      <p className="text-xs text-white/50">
                        No matches yet. Try another keyword.
                      </p>
                    ) : (
                      calculatorMatches.map((item) => (
                        <button
                          key={`calc-${item.id}`}
                          type="button"
                          className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#1B2B40] px-3 py-2 text-left bg-[#101D2D] hover:bg-[#132235] transition-colors"
                          onClick={() => addCalculatorItem(item)}
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {item.name}
                            </p>
                            <p className="text-xs text-white/60">
                              {formatCurrency(item.minPrice)} {unitDisplay(item.unitLabel)}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#4EAEE5]">
                            <Plus className="w-3 h-3" /> Add
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      Your items
                    </p>
                    {calculatorItems.length > 0 && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#4EAEE5] hover:text-[#63BCEE]"
                        onClick={() => setCalculatorItems([])}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {calculatorItems.length === 0 ? (
                    <p className="text-xs mt-3 text-white/50">
                      Add items to build your tentative bill.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {calculatorItems.map((line) => {
                        const isWeight = line.unitLabel === '/kg' || line.unitLabel === '/sq ft';
                        const step = isWeight ? 0.1 : 1;
                        const minValue = isWeight ? 0.1 : 1;
                        return (
                          <div
                            key={line.id}
                            className="rounded-xl border border-[#1B2B40] p-3 bg-[#101D2D]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {line.name}
                                </p>
                                <p className="text-xs text-white/60">
                                  {formatCurrency(line.rate)} {unitDisplay(line.unitLabel)}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="rounded-full p-2 text-white/40 hover:text-[#EF4444] transition-colors"
                                onClick={() => setCalculatorItems((prev) => prev.filter((item) => item.id !== line.id))}
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-white/70">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  min={minValue}
                                  step={step}
                                  value={line.quantity}
                                  onChange={(event) =>
                                    updateCalculatorQuantity(line.id, Number(event.target.value))
                                  }
                                  className="mt-1 w-full rounded-xl border-none bg-[#0F1B2B] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4EAEE5]/40"
                                  style={{ fontFamily: 'var(--font-body)' }}
                                />
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-white/60">Line total</p>
                                <p className="text-sm font-semibold text-white">
                                  {formatCurrency(line.rate * line.quantity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#1B2B40] bg-[#091420] px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Estimated total</p>
                  <p className="text-lg font-bold text-[#4EAEE5]">
                    {formatCurrency(calculatorTotal)}
                  </p>
                </div>
                <p className="text-xs mt-2 text-white/50">
                  Final charges may vary after inspection and packaging.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
