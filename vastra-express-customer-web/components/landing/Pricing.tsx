import Link from 'next/link';
import { ArrowRight, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/serviceCatalog';

const VALUE_POINTS = [
  {
    title: 'Transparent Pricing',
    text: 'Every item has a clear rate. No hidden line-items at checkout.',
    Icon: ShieldCheck,
  },
  {
    title: 'Search and Filter Ready',
    text: 'Use global search, category filters, and price ranges in the full catalog.',
    Icon: Search,
  },
  {
    title: 'Premium Item Clarity',
    text: 'Heavy, premium, and special garments are clearly tagged before booking.',
    Icon: Sparkles,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-[#0C1A2F] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="kicker-chip border border-white/10 bg-white/5 text-[#4EAEE5]">
            Transparent Pricing
          </span>
          <h2
            className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            One Catalog, All Service Rates
          </h2>
          <p className="mt-5 text-base leading-8 text-white/80">
            Browse complete category-wise pricing with smart search, filters, and expandable sections.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {VALUE_POINTS.map(({ title, text, Icon }) => (
            <article key={title} className="lively-card rounded-2xl bg-white/[0.03] p-5 shadow-sm transition-all hover:bg-white/[0.06]">
              <span className="icon-pop flex h-11 w-11 items-center justify-center rounded-[8px] bg-white/5 text-[#4EAEE5]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-white/70">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white/[0.03] p-5 shadow-lively md:p-6">
          <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Categories now covered
          </h3>
          <p className="mt-2 text-sm leading-7 text-white/70">
            Complete catalog available with instant search and structured browsing.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((category) => (
              <span
                key={category.id}
                className="inline-flex rounded-full bg-white/[0.05] px-3 py-1.5 text-sm font-bold text-[#4EAEE5] transition-colors hover:bg-white/[0.08]"
              >
                {category.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="mb-5 text-white/70">Open the full pricing explorer for all items, tabs, and filters.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing">
              <button className="inline-flex items-center gap-2 rounded-[8px] bg-[#4EAEE5] px-8 py-3.5 text-sm font-extrabold text-[#07111C] shadow-brand transition-all duration-200 hover:-translate-y-1 hover:bg-[#63BCEE] hover:shadow-lively">
                View Full Pricing
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/login">
              <button className="inline-flex rounded-[8px] border-2 border-white/40 bg-transparent px-7 py-3.5 text-sm font-extrabold text-white transition-all duration-200 hover:-translate-y-1 hover:bg-white/10">
                Book Pickup
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
