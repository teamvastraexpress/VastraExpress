const PILLARS = [
  {
    icon: '⏱️',
    title: '24-Hour Turnaround',
    description: 'Morning pickup, evening delivery. Express slots available every day.',
    accent: '#A8D8F0',
    bg: '#E8F4FB',
  },
  {
    icon: '📊',
    title: 'Transparent Pricing',
    description: 'See the full price before you confirm. No hidden charges, GST shown clearly.',
    accent: '#C5CAE9',
    bg: '#EEF0FF',
  },
  {
    icon: '🌿',
    title: 'Eco-Friendly',
    description: 'Biodegradable detergents, energy-efficient machines, minimal plastic packaging.',
    accent: '#A8D8C0',
    bg: '#E8F8F0',
  },
  {
    icon: '🛡️',
    title: 'Fabric-Safe Guarantee',
    description: 'If we damage it, we replace it. No questions asked. Your clothes are fully protected.',
    accent: '#F5A623',
    bg: '#FEF9EE',
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
      className="py-24 relative overflow-hidden"
      style={{ background: '#3B9FE5' }}
    >
      {/* Background photo overlay at 15% opacity for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?auto=format&fit=crop&w=1600&q=60)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.12,
        }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(59,159,229,0.88)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            Why Choose Us
          </span>
          <h2
            className="mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 700, color: 'white' }}
          >
            Why Chose Us?
          </h2>
          <p
            className="max-w-xl mx-auto"
            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(255,255,255,0.80)' }}
          >
            Four pillars that make Vastra Express the clear choice over every competitor in the city.
          </p>
        </div>

        {/* 4-pillar cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PILLARS.map((p, idx) => (
            <div
              key={p.title}
              className="rounded-2xl p-7 flex flex-col items-center text-center hover:scale-105 transition-all duration-200 animate-fade-in-up"
              style={{
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                animationDelay: `${idx * 0.1}s`,
                border: p.highlight ? `2px solid ${p.accent}` : '2px solid transparent',
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
                style={{ background: p.bg, border: `2px solid ${p.accent}` }}
              >
                {p.icon}
              </div>
              {p.highlight && (
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2"
                  style={{ background: '#FEF3C7', color: '#92400E' }}
                >
                  Our Differentiator
                </span>
              )}
              <h3
                className="font-bold mb-2"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: '#1B2A3B' }}
              >
                {p.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#4A5A6B', lineHeight: '1.7' }}>
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 rounded-2xl px-6 sm:px-8 py-10"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center animate-fade-in-up ${i < STATS.length - 1 ? 'sm:border-r border-white/20' : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <p
                className="font-extrabold tracking-tight"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: 'white' }}
              >
                {stat.value}
              </p>
              <p className="text-sm mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
