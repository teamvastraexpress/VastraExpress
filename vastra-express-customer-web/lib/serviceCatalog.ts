export type BaseCategoryId =
  | 'laundry'
  | 'dry-cleaning'
  | 'steam-ironing'
  | 'bags-shoes'
  | 'home-furnishing'
  | 'cleaning-sanitization';

export type CatalogCategoryId = BaseCategoryId | 'premium-special';

export type DryCleaningTabId = 'all' | 'men' | 'women' | 'children';

export type ServiceTag = 'popular' | 'premium' | 'heavy';

export interface ServiceCategoryMeta {
  id: CatalogCategoryId;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  sampleItems: Array<{ label: string; priceLabel: string }>;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  categoryId: BaseCategoryId;
  dryCleaningTab?: DryCleaningTabId;
  unitLabel: string;
  minPrice: number;
  maxPrice: number;
  priceLabel: string;
  tags: ServiceTag[];
  aliases: string[];
  sourceRateLabels: string[];
  searchText: string;
}

export type PriceRangeId = 'all' | 'under-100' | '100-300' | '300-600' | 'above-600';

export const PRICE_RANGE_OPTIONS: Array<{ id: PriceRangeId; label: string }> = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-100', label: 'Under Rs 100' },
  { id: '100-300', label: 'Rs 100 - Rs 300' },
  { id: '300-600', label: 'Rs 300 - Rs 600' },
  { id: 'above-600', label: 'Above Rs 600' },
];

export const DRY_CLEANING_TABS: Array<{ id: DryCleaningTabId; label: string }> = [
  { id: 'all', label: 'All Dry Cleaning' },
  { id: 'men', label: "Men's Wear" },
  { id: 'women', label: "Women's Wear" },
  { id: 'children', label: "Children's Wear" },
];

export const SERVICE_CATEGORIES: ServiceCategoryMeta[] = [
  {
    id: 'laundry',
    label: 'Laundry',
    shortLabel: 'Laundry',
    icon: 'L',
    description: 'Weight-based express and regular laundry with starch and dry-only options.',
    sampleItems: [
      { label: 'Up To 3 Kg Express', priceLabel: 'Rs 270' },
      { label: '3Kg To 6Kg Regular', priceLabel: 'Rs 60' },
      { label: 'Dry Only', priceLabel: 'Rs 24' },
    ],
  },
  {
    id: 'dry-cleaning',
    label: 'Dry Cleaning',
    shortLabel: 'Dry Clean',
    icon: 'D',
    description: 'Comprehensive dry cleaning for men, women, and children with special garment care.',
    sampleItems: [
      { label: 'Shirt / T-Shirt', priceLabel: 'Rs 120' },
      { label: 'Saree Plain', priceLabel: 'Rs 180' },
      { label: 'Suit (2 PCS)', priceLabel: 'Rs 475' },
    ],
  },
  {
    id: 'steam-ironing',
    label: 'Steam Ironing',
    shortLabel: 'Steam Iron',
    icon: 'I',
    description: 'Normal, medium, heavy, and spot-removal steam ironing options.',
    sampleItems: [
      { label: 'Steam Iron Normal', priceLabel: 'Rs 15' },
      { label: 'Steam Iron (Packing)', priceLabel: 'Rs 20' },
      { label: 'Steam Iron Heavy', priceLabel: 'Rs 60 - Rs 350' },
    ],
  },
  {
    id: 'bags-shoes',
    label: 'Bags and Shoes',
    shortLabel: 'Bags & Shoes',
    icon: 'B',
    description: 'Handbags, trolley bags, and shoe laundry with normal and heavy variants.',
    sampleItems: [
      { label: 'Handbag (Normal)', priceLabel: 'Rs 420' },
      { label: 'Trolley Bag Heavy', priceLabel: 'Rs 600' },
      { label: 'Normal Shoes', priceLabel: 'Rs 420' },
    ],
  },
  {
    id: 'home-furnishing',
    label: 'Home and Furnishing',
    shortLabel: 'Home',
    icon: 'H',
    description: 'Curtains, quilts, blankets, sofa covers, cushion covers, and bedding care.',
    sampleItems: [
      { label: 'Bed Sheet (Double)', priceLabel: 'Rs 120' },
      { label: 'Blanket (Heavy)', priceLabel: 'Rs 720' },
      { label: 'Curtain 6 ft', priceLabel: 'Rs 300' },
    ],
  },
  {
    id: 'cleaning-sanitization',
    label: 'Cleaning and Sanitization',
    shortLabel: 'Cleaning',
    icon: 'C',
    description: 'Carpet, mattress, sofa, wall cleaning, and sanitization services.',
    sampleItems: [
      { label: 'Carpet Cleaning', priceLabel: 'Rs 30 / sq ft' },
      { label: 'Sofa Cleaning', priceLabel: 'Rs 500' },
      { label: 'Car Sanitization', priceLabel: 'Rs 449' },
    ],
  },
  {
    id: 'premium-special',
    label: 'Premium and Special',
    shortLabel: 'Premium',
    icon: 'P',
    description: 'Wedding wear, leather items, and high-detail heavy garment treatment.',
    sampleItems: [
      { label: 'Wedding Dress 3 PCS (Heavy)', priceLabel: 'Rs 1200 - Rs 1500' },
      { label: 'Sherwani 3 PCS (Heavy)', priceLabel: 'Rs 500 - Rs 600' },
      { label: 'Leather Jacket Heavy', priceLabel: 'Rs 420' },
    ],
  },
];

type SourceGroup =
  | 'BAG_LAUNDRY'
  | 'CARPET_CLEANING'
  | 'DRY_CLEAN_MEN'
  | 'DRY_CLEAN_WOMEN'
  | 'DRY_CLEAN_CHILDREN'
  | 'HOUSE_HOLD'
  | 'LAUNDRY'
  | 'STEAM_IRONING'
  | 'HOME_FURNISHING'
  | 'HANDBAG_LAUNDRY'
  | 'SHOE_LAUNDRY'
  | 'SANITIZATION'
  | 'SOFA_CLEANING';

interface RawCatalogRow {
  source: SourceGroup;
  item: string;
  rateLabel: string;
  dryCleaningTab?: DryCleaningTabId;
}

const SOURCE_TO_CATEGORY: Record<SourceGroup, BaseCategoryId> = {
  BAG_LAUNDRY: 'bags-shoes',
  CARPET_CLEANING: 'cleaning-sanitization',
  DRY_CLEAN_MEN: 'dry-cleaning',
  DRY_CLEAN_WOMEN: 'dry-cleaning',
  DRY_CLEAN_CHILDREN: 'dry-cleaning',
  HOUSE_HOLD: 'home-furnishing',
  LAUNDRY: 'laundry',
  STEAM_IRONING: 'steam-ironing',
  HOME_FURNISHING: 'home-furnishing',
  HANDBAG_LAUNDRY: 'bags-shoes',
  SHOE_LAUNDRY: 'bags-shoes',
  SANITIZATION: 'cleaning-sanitization',
  SOFA_CLEANING: 'cleaning-sanitization',
};

function buildRows(
  source: SourceGroup,
  rows: Array<[string, string]>,
  dryCleaningTab?: DryCleaningTabId,
): RawCatalogRow[] {
  return rows.map(([item, rateLabel]) => ({ source, item, rateLabel, dryCleaningTab }));
}

const RAW_CATALOG_ROWS: RawCatalogRow[] = [
  ...buildRows('BAG_LAUNDRY', [
    ['BAG NORMAL', '420'],
    ['BAG (H)', '480'],
    ['HAND BAG', '180'],
    ['BAG', '240'],
    ['TROLLY BAG NORMAL', '180'],
    ['TROLLY BAG HEAVY', '600'],
  ]),

  ...buildRows('CARPET_CLEANING', [
    ['CARPET CLEANING', '30 Sq fit'],
    ['Mattress Cleaning', '25 Sq fit'],
    ['CARPET/ DOORMAT', '50'],
  ]),

  ...buildRows(
    'DRY_CLEAN_MEN',
    [
      ['SUIT (2 PCS)', '475'],
      ['SUIT 3 Pcs', '649'],
      ['WAIST COAT', '240'],
      ['SAFARI SUIT', '330'],
      ['COAT/ BLAZER', '360'],
      ['TROUSER', '120'],
      ['OVERCOAT', '500'],
      ['PULLOVER/ CARDIGAN-HALF', '120'],
      ['PULLOVER/ CARDIGAN-FULL', '200'],
      ['DRESSING GOWN', '120'],
      ['TIE', '72'],
      ['SHIRT/ T-SHIRT', '120'],
      ['KURTA PAJAMA-COTTON', '180'],
      ['KURTA PAJAMA-SILK', '240'],
      ['SHERWANI 3PCS-(HEAVY)', '600'],
      ['SHERWANI 3PCS-(LIGHT)', '400'],
      ['SHAWL/ LOI', '250'],
      ['VEST (WOOLEN)', '120'],
      ['KURTA-COTTON', '150'],
      ['KURTA-SILK', '220'],
      ['JACKET-LIGHT', '360'],
      ['JACKET-HEAVY', '480'],
      ['JACKET-LEATHER', '600'],
      ['MUFLER', '75'],
      ['SWEATER', '300'],
      ['TIE SILK', '84'],
      ['SWEATOR (LIGHT)', '275'],
      ['SHERWANI 3PCS (HEAVY)', '500'],
      ['PAYJAMA', '60'],
    ],
    'men',
  ),

  ...buildRows(
    'DRY_CLEAN_WOMEN',
    [
      ['CHURIDAR PAJAMA', '120'],
      ['SCARF', '60'],
      ['LONG KURTA /JACKET', '264'],
      ['SLACKS', '60'],
      ['SHORTS/ SKIRT/ FROCK', '72'],
      ['DRESSING GOWN', '360'],
      ['BLOUSE-NORMAL', '85'],
      ['BLOUSE-ORNAMENTAL', '133'],
      ['BLOUSE-WOOLEN', '120'],
      ['WEDDING DRESS (GHAGRA/ BLOUSE/ DUPATTA)', '579/ 799/1500'],
      ['SLACKS-SALWAR', '120'],
      ['PLAZO', '180'],
      ['SHIRT / TOP', '120'],
      ['SALWAR KAMEEZ ( 2 PCS )-LIGHT', '269'],
      ['SALWAR KAMEEZ ( 2 PCS )-HEAVY', '360'],
      ['SHAWL', '300'],
      ['STOLE', '144'],
      ['GHAGRA-( PLAIN )', '300'],
      ['GHAGRA-( ORNAMENTAL )', '600'],
      ['DUPATT-PLAIN', '72'],
      ['DUPATT-ORNAMENTAL', '144'],
      ['DUPATT-ORNAMENTALS', '240'],
      ['TROUSER(LADIES)', '120'],
      ['NIGHTY', '120'],
      ['SKIRT', '150'],
      ['SLIP', '60'],
      ['KAMEEZ-HEAVY (LADIES)', '180'],
      ['SALWAR KAMEEZ DUPATTA ( 3 PCS )-LIGHT', '360'],
      ['SALWAR KAMEEZ DUPATTA ( 3 PCS )-HEAVY', '480'],
      ['CAPRI', '72'],
      ['STARCH+ DRY CL.3PCS', '240'],
      ['W.D 3PCS(POLISH)', '240'],
      ['SAREE POLISH(M)', '90'],
      ['SAREE POLISH(N)', '90'],
      ['KAMEEJ POLISH', '75'],
      ['LADIES PURSE-LIGHT', '240'],
      ['LADIES PURSE-NORMAL', '360'],
      ['SWEATOR -HEAVY', '360'],
      ['LEHANGA (3PC-HEAVY)', '540'],
      ['LEATHER JACKET HEAVY', '420'],
      ['GHAGHRA3PC. POLISH', '250'],
      ['WEDDING DRESS HEAVY', '600'],
      ['SAREE POLISH(H)', '120'],
      ['FROCK(HEAVY)', '216'],
      ['SAREE (HEAVY ORNAMENTAL)', '600'],
      ['SHIRT/TOP (LADIES)', '120'],
      ['WEDDING DRESS 3 PCS.(HEAVY)', '1200/1500'],
      ['OVER COAT (HEAVY)', '360'],
      ['LADIES GOWN (H)', '900'],
      ['SKD 3 PCS.POLISH', '120'],
      ['WOOLEN KURTA', '288'],
      ['JUMP SUIT', '300'],
      ['LADIES DRESS', '360'],
      ['SALWAR-PLAZO', '180'],
      ['SALWAR KAMEEZ(3PCS) HEAVY', '360'],
      ['GHAGHRA-(PLAIN)', '240'],
      ['GHAGHRA-(ORNAMENTAL)', '500/750'],
      ['RAIN COAT', '90'],
      ['PETICOT', '60'],
      ['LADIES PURSE-HEAVY', '600'],
      ['KURTI/LADIES SHIRT', '108'],
      ['SHORTS/SKIRT/FROCK', '90'],
      ['SALWAR KAMEEJ (WOOLEN)', '360'],
      ['SALWAR KAMEEJ DUPATTA(WOOLEN)', '420'],
      ['DRESSING(DRESS)', '432'],
      ['OVERCOAT', '500'],
      ['SAREE-PLAIN', '180'],
      ['SAREE-EMBROIDERY', '240'],
      ['SAREE-SILK', '360'],
      ['SAREE-ORNAMENTAL', '480'],
      ['SAREE-HEAVY ORNAMENTAL', '720'],
      ['KAMEEZ-LIGHT', '144'],
    ],
    'women',
  ),

  ...buildRows(
    'DRY_CLEAN_CHILDREN',
    [
      ['KURTA ( CHILD )', '84'],
      ['CARDIGAN', '360'],
      ['SUIT 2PC CHILD', '300'],
      ['COAT/BLAZER (CHILD)', '240'],
      ['SUIT 3 PCS', '600'],
      ['FROCK', '144'],
      ['SUIT POLISH', '120'],
      ['BLOUSE POLISH', '30'],
      ['CHILD JACKET', '240'],
      ['SOFA BACK COVER', '96'],
      ['PATHANI SUIT', '360'],
      ['SWEATER CHILD', '144'],
      ['KURTA POLISH', '25'],
      ['KURTA- PAYJAMA (WOLLEN)', '180'],
      ['PAYJAMA (WOOLEN)', '90'],
      ['SHIRT(WOOLEN)', '180'],
      ['GHAGHRA(CHILD)', '240'],
      ['SHIRT/T-SHIRT(CHILD)', '85'],
      ['TROUSER(CHILD)', '108'],
      ['SALWAR KAMEEJ(CHILD)', '180'],
      ['SUIT 3PCS (CHILD)', '300'],
      ['OTHER SMALL ITEM', '78'],
      ['KURTA PAJAMA(CHILD)', '120'],
    ],
    'children',
  ),

  ...buildRows('HOUSE_HOLD', [
    ['GLOVES', '48'],
    ['CAPS/ HAT', '72'],
    ['COMFOTOR-(S)', '425'],
    ['COMFOTOR-(D)', '540'],
    ['QUILT-SINGLE', '420'],
    ['QUILT-DOUBLE', '600'],
    ['BED SHEET DOUBLE', '120'],
    ['PILLOW', '150'],
    ['BLANKET-(S) HEAVY', '300'],
    ['BLANKET-DOUBLE (H)', '700'],
    ['SOFA COVER-NORMAL', '180'],
    ['SOFA COVER-(HEAVY)', '300'],
    ['SOFA COVER-(SINGLE)', '90'],
    ['CURTAIN-(HEAVY)', '240'],
    ['CURTAIN-(LARGE)', '300'],
    ['CUSHAN COVER(S)', '72'],
    ['CUSHAN(SMALL)', '60'],
    ['TOWEL HEAVY', '60'],
    ['DOHAR', '150'],
    ['SOFT TOY(H)', '360'],
    ['CURTAIN-D (HEAVY)', '600'],
    ['CURTAIN-WINDOW', '60'],
    ['CURTAIN-(HEAVY)', '300'],
    ['CAMEL LEATHER', '840'],
    ['KUSHAN', '120'],
    ['BIN BAG-NORMAL', '480'],
    ['BIN BAG-LARGE', '600'],
    ['CUSHON COVER-(B)', '144'],
    ['CUSHON COVER-(SMALL)', '48'],
    ['KUSHAN', '96'],
    ['PILLOW', '72'],
    ['Blanket-Single layer', '480'],
    ['Blanket-double layer', '600'],
  ]),

  ...buildRows('LAUNDRY', [
    ['Up To 3 Kg Express', '270'],
    ['3Kg To 6 Kg Express', '90'],
    ['6 Kg & Above Express', '90'],
    ['3Kg To 6Kg Regular', '60'],
    ['6 Kg & Above Regular', '54'],
    ['DRY ONLY', '24'],
    ['UP TO 3KG REGULAR', '222'],
    ['STARCH SUIT', '24'],
    ['STARCH', '12'],
    ['STEAM IRON(SAREE)', '50'],
  ]),

  ...buildRows('STEAM_IRONING', [
    ['Steam Iron Normal', '15'],
    ['Steam Iron (Packing)', '20'],
    ['STEAM IRON HEAVY', '75'],
    ['STEAM IRON WITH SPOT REMOVAL', '180'],
    ['STEAM IRON HEAVY', '350'],
    ['STEAM IRONING (H)', '150'],
    ['Steam Iron Medium', '40'],
    ['Steam Iron Heavy', '60'],
  ]),

  ...buildRows('HOME_FURNISHING', [
    ['Quilt (Double)', '720'],
    ['Quilt (Single)', '540'],
    ['Curtain 6 ft', '300'],
    ['Window Curtain', '240'],
    ['Blanket (Heavy)', '720'],
    ['Blanket (Medium)', '600'],
    ['Blanket (Light)', '420'],
    ['Bed Sheet (Double)', '120'],
    ['Bed Sheet (Single)', '90'],
  ]),

  ...buildRows('HANDBAG_LAUNDRY', [
    ['Handbag (Heavy)', '480'],
    ['Handbag (Normal)', '420'],
  ]),

  ...buildRows('SHOE_LAUNDRY', [
    ['SHOES (H)', '480'],
    ['NORMAL SHOES', '420'],
  ]),

  ...buildRows('SANITIZATION', [
    ['Car Sanitization', '449'],
    ['Sanitization per sq ft.', '3'],
  ]),

  ...buildRows('SOFA_CLEANING', [
    ['CHAIR', '150'],
    ['WALL CLEANING', '24'],
    ['SOFA CLEANING', '500'],
    ['OFFICE CHAIR', '180'],
    ['SOFA (LEATHER)', '550'],
    ['OFFICE CHAIRS', '150'],
    ['SOFA (HEAVY)', '600'],
    ['CHAIR', '300'],
    ['SOFA MEDIUM', '400'],
  ]),
];

const LABEL_FIXUPS: Array<[RegExp, string]> = [
  [/DUPATT[A-Z]*/gi, 'DUPATTA'],
  [/KAMEEJ/gi, 'KAMEEZ'],
  [/SWEATOR/gi, 'SWEATER'],
  [/GHAGHRA/gi, 'GHAGRA'],
  [/PETICOT/gi, 'PETTICOAT'],
  [/COMFOTOR/gi, 'COMFORTER'],
  [/CUSHAN|CUSHON|KUSHAN/gi, 'CUSHION'],
  [/TROLLY/gi, 'TROLLEY'],
  [/PAYJAMA/gi, 'PAJAMA'],
  [/WOLLEN/gi, 'WOOLEN'],
  [/\bPLAZO\b/gi, 'PALAZZO'],
  [/\s+/g, ' '],
];

const POPULAR_KEYWORDS = [
  'shirt',
  't-shirt',
  'saree',
  'suit',
  'steam iron normal',
  'up to 3 kg express',
  'dry only',
  'sofa cleaning',
  'handbag (normal)',
];

const PREMIUM_KEYWORDS = [
  'wedding',
  'ornamental',
  'leather',
  'sherwani',
  'lehanga',
  'ghagra',
  'gown',
  'silk',
  'overcoat',
];

const HEAVY_KEYWORDS = ['heavy', '(h)', ' h)', '-h', 'ornamental'];

function canonicalizeLabel(value: string): string {
  let result = value.toUpperCase().replace(/[+]/g, ' ').replace(/[.&]/g, ' ').replace(/\//g, ' ');
  for (const [pattern, replacement] of LABEL_FIXUPS) {
    result = result.replace(pattern, replacement);
  }
  return result.replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function prettyLabel(value: string): string {
  const cleaned = value
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned
    .split(' ')
    .map((part) => {
      const lower = part.toLowerCase();
      if (/^[0-9]+$/.test(part)) return part;
      if (/^[0-9]+(kg|pcs|pc)$/i.test(part)) return part.toUpperCase();
      if (['kg', 'pcs', 'pc', 'sq', 'ft', '&', 'h', 's', 'd'].includes(lower)) return part.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .replace(/Sq Ft/gi, 'sq ft')
    .replace(/Dry Cl/gi, 'Dry Clean')
    .replace(/\s+\)/g, ')')
    .replace(/\(\s+/g, '(');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parsePrices(rateLabel: string): number[] {
  const matches = rateLabel.match(/\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map((part) => Number(part));
}

function inferUnit(row: RawCatalogRow): string {
  const text = `${row.item} ${row.rateLabel}`.toLowerCase();

  if (text.includes('sq fit') || text.includes('sq ft') || text.includes('per sq')) return '/sq ft';
  if (row.source === 'SHOE_LAUNDRY') return '/pair';
  if (text.includes('kg') && (text.includes('up to') || text.includes('to') || text.includes('above'))) return '/load';
  if (text.includes('kg') && row.source === 'LAUNDRY') return '/kg';
  if (text.includes('car sanitization')) return '/car';
  return '/item';
}

function inferTags(itemName: string, minPrice: number, maxPrice: number): ServiceTag[] {
  const text = itemName.toLowerCase();
  const tags = new Set<ServiceTag>();

  if (POPULAR_KEYWORDS.some((keyword) => text.includes(keyword))) {
    tags.add('popular');
  }

  if (PREMIUM_KEYWORDS.some((keyword) => text.includes(keyword)) || maxPrice >= 600) {
    tags.add('premium');
  }

  if (HEAVY_KEYWORDS.some((keyword) => text.includes(keyword)) || minPrice >= 500) {
    tags.add('heavy');
  }

  return Array.from(tags);
}

function formatPriceLabel(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return `Rs ${minPrice}`;
  }
  return `Rs ${minPrice} - Rs ${maxPrice}`;
}

interface AggregateItem {
  id: string;
  name: string;
  categoryId: BaseCategoryId;
  dryCleaningTab?: DryCleaningTabId;
  unitLabel: string;
  minPrice: number;
  maxPrice: number;
  tags: Set<ServiceTag>;
  aliases: Set<string>;
  sourceRateLabels: Set<string>;
}

const aggregateMap = new Map<string, AggregateItem>();

for (const row of RAW_CATALOG_ROWS) {
  const categoryId = SOURCE_TO_CATEGORY[row.source];
  const canonical = canonicalizeLabel(row.item);
  const prices = parsePrices(row.rateLabel);
  if (prices.length === 0) {
    continue;
  }

  const rowMin = Math.min(...prices);
  const rowMax = Math.max(...prices);
  const unitLabel = inferUnit(row);
  const key = `${categoryId}|${row.dryCleaningTab ?? 'all'}|${canonical}|${unitLabel}`;
  const normalizedName = prettyLabel(canonical.toLowerCase());
  const rowTags = inferTags(normalizedName, rowMin, rowMax);

  if (!aggregateMap.has(key)) {
    aggregateMap.set(key, {
      id: `${categoryId}-${row.dryCleaningTab ?? 'all'}-${slugify(canonical)}-${slugify(unitLabel)}`,
      name: normalizedName,
      categoryId,
      dryCleaningTab: row.dryCleaningTab,
      unitLabel,
      minPrice: rowMin,
      maxPrice: rowMax,
      tags: new Set(rowTags),
      aliases: new Set([prettyLabel(row.item)]),
      sourceRateLabels: new Set([row.rateLabel]),
    });
    continue;
  }

  const existing = aggregateMap.get(key);
  if (!existing) continue;

  existing.minPrice = Math.min(existing.minPrice, rowMin);
  existing.maxPrice = Math.max(existing.maxPrice, rowMax);
  existing.aliases.add(prettyLabel(row.item));
  existing.sourceRateLabels.add(row.rateLabel);
  rowTags.forEach((tag) => existing.tags.add(tag));
}

export const SERVICE_CATALOG_ITEMS: ServiceCatalogItem[] = Array.from(aggregateMap.values())
  .map((item) => {
    const aliases = Array.from(item.aliases);
    const sourceRateLabels = Array.from(item.sourceRateLabels);
    const tags = Array.from(item.tags);

    const searchText = [
      item.name,
      ...aliases,
      SERVICE_CATEGORIES.find((category) => category.id === item.categoryId)?.label ?? '',
      item.dryCleaningTab ?? '',
      ...tags,
    ]
      .join(' ')
      .toLowerCase();

    return {
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      dryCleaningTab: item.dryCleaningTab,
      unitLabel: item.unitLabel,
      minPrice: item.minPrice,
      maxPrice: item.maxPrice,
      priceLabel: formatPriceLabel(item.minPrice, item.maxPrice),
      tags,
      aliases,
      sourceRateLabels,
      searchText,
    };
  })
  .sort((a, b) => {
    if (a.categoryId !== b.categoryId) return a.categoryId.localeCompare(b.categoryId);
    if ((a.dryCleaningTab ?? '') !== (b.dryCleaningTab ?? '')) {
      return (a.dryCleaningTab ?? '').localeCompare(b.dryCleaningTab ?? '');
    }
    if (a.minPrice !== b.minPrice) return a.minPrice - b.minPrice;
    return a.name.localeCompare(b.name);
  });

export const POPULAR_SERVICE_ITEMS: ServiceCatalogItem[] = SERVICE_CATALOG_ITEMS.filter((item) =>
  item.tags.includes('popular'),
).slice(0, 9);

export function categoryItems(categoryId: CatalogCategoryId): ServiceCatalogItem[] {
  if (categoryId === 'premium-special') {
    return SERVICE_CATALOG_ITEMS.filter(
      (item) => item.tags.includes('premium') || item.tags.includes('heavy'),
    );
  }
  return SERVICE_CATALOG_ITEMS.filter((item) => item.categoryId === categoryId);
}

export function byPriceRange(items: ServiceCatalogItem[], priceRange: PriceRangeId): ServiceCatalogItem[] {
  if (priceRange === 'all') return items;

  if (priceRange === 'under-100') {
    return items.filter((item) => item.minPrice < 100);
  }

  if (priceRange === '100-300') {
    return items.filter((item) => item.maxPrice >= 100 && item.minPrice <= 300);
  }

  if (priceRange === '300-600') {
    return items.filter((item) => item.maxPrice >= 300 && item.minPrice <= 600);
  }

  return items.filter((item) => item.maxPrice > 600);
}

export function bySearchQuery(items: ServiceCatalogItem[], query: string): ServiceCatalogItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => item.searchText.includes(normalized));
}

export function tagLabel(tag: ServiceTag): string {
  if (tag === 'popular') return 'Popular';
  if (tag === 'premium') return 'Premium';
  return 'Heavy';
}

export function tagBadgeVariant(tag: ServiceTag): 'brand' | 'warning' | 'danger' {
  if (tag === 'popular') return 'brand';
  if (tag === 'premium') return 'warning';
  return 'danger';
}
