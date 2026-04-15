import Link from 'next/link';
import { ArrowRight, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/serviceCatalog';

const VALUE_POINTS = [
  {
    title: 'Transparent Pricing',
    text: 'Every item has a clear rate. No hidden line-items at checkout.',
    icon: ShieldCheck,
  },
  {
    title: 'Search and Filter Ready',
    text: 'Use global search, category filters, and price ranges in the full catalog.',
    icon: Search,
  },
  {
    title: 'Premium Item Clarity',
    text: 'Heavy, premium, and special garments are clearly tagged before booking.',
    icon: Sparkles,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            One Catalog, All Service Rates
          </h2>
          <p className="max-w-xl mx-auto" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4A5A6B' }}>
            Browse complete category-wise pricing with smart search, filters, and expandable sections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {VALUE_POINTS.map((point, idx) => {
            const Icon = point.icon;
            return (
              <article
                key={point.title}
                className="rounded-2xl border border-[#A8D8F0] bg-white p-6 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#E8F4FB] text-[#1A6FC4] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1B2A3B] mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                  {point.title}
                </h3>
                <p className="text-sm text-[#4A5A6B] leading-relaxed">{point.text}</p>
              </article>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#A8D8F0] bg-[#F7FBFF] p-6 sm:p-8 mb-10">
          <h3 className="text-xl font-bold text-[#1B2A3B] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Categories now covered
          </h3>
          <p className="text-sm text-[#4A5A6B] mb-4">
            Complete catalog available with instant search and structured browsing.
          </p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center rounded-full border border-[#A8D8F0] bg-white px-3 py-1.5 text-sm font-semibold text-[#1A6FC4]"
              >
                {category.label}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="mb-5 text-[#4A5A6B]" style={{ fontFamily: 'var(--font-body)' }}>
            Open the full pricing explorer for all items, tabs, and filters.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/pricing">
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
                View Full Pricing
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/login">
              <button className="btn-secondary text-sm px-7 py-3.5">Book Pickup</button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
