import { BarChart3, Clock3, Leaf, ShieldCheck } from 'lucide-react';

const PILLARS = [
  {
    Icon: Clock3,
    title: '24-Hour Turnaround',
    description: 'Morning pickup, evening delivery. Express slots available every day.',
    highlight: false,
  },
  {
    Icon: BarChart3,
    title: 'Transparent Pricing',
    description: 'See the full price before you confirm. No hidden charges, GST shown clearly.',
    highlight: false,
  },
  {
    Icon: Leaf,
    title: 'Eco-Friendly',
    description: 'Biodegradable detergents, energy-efficient machines, minimal plastic packaging.',
    highlight: false,
  },
  {
    Icon: ShieldCheck,
    title: 'Fabric-Safe Guarantee',
    description: 'If we damage it, we replace it. No questions asked. Your clothes are fully protected.',
    highlight: true,
  },
];

const STATS = [
  { value: '2,000+', label: 'Orders Completed' },
  { value: '98%', label: 'On-Time Delivery' },
  { value: '4.9★', label: 'Customer Rating' },
  { value: '24hr', label: 'Express Turnaround' },
];

export function WhyUs() {
  return (
    <section
      id="why-us"
      className="relative isolate overflow-hidden bg-[#07111C] py-20 md:py-28"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#07111C] via-[#0C1A2F] to-[#07111C]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07111C] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="kicker-chip border border-white/10 bg-white/10 text-white backdrop-blur">
            Why Choose Us
          </span>
          <h2
            className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Why Chose Us?
          </h2>
          <p className="mt-5 text-base leading-8 text-white/76">
            Four pillars that make Vastra Express the clear choice over every competitor in the city.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PILLARS.map(({ Icon, title, description, highlight }) => (
            <article
              key={title}
              className={`lively-card flex h-full flex-col rounded-2xl p-5 text-center transition-all ${highlight
                ? 'bg-[#4EAEE5]/15 shadow-brand text-white'
                : 'bg-white/[0.03] hover:bg-white/[0.06] text-white backdrop-blur'
                }`}
            >
              <span
                className={`icon-pop mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] ${highlight ? 'bg-[#4EAEE5] text-[#07111C]' : 'bg-white/10 text-[#4EAEE5]'
                  }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {highlight && (
                <span className="mt-4 inline-flex self-center rounded-full bg-white/[0.05] px-3 py-1 text-xs font-bold text-[#4EAEE5]">
                  Our Differentiator
                </span>
              )}
              <h3
                className="mt-4 text-lg font-bold text-white"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-white/80">
                {description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white/[0.03] p-4 text-center text-white backdrop-blur"
            >
              <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
