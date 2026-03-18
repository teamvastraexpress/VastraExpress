import Link from 'next/link';

const SERVICES = [
  {
    icon: '🫧',
    name: 'Wash & Fold',
    problem: 'Weekly household laundry',
    keyLine: 'Same-day for orders before 10am',
    from: 'From ₹49/kg',
    gradient: 'from-[#1A6FC4] via-[#1A6FC4] to-[#145DA0]',
    texture: 'radial-gradient(ellipse at 30% 30%, rgba(168,216,240,0.25) 0%, transparent 60%)',
    badge: null,
  },
  {
    icon: '✨',
    name: 'Dry Cleaning',
    problem: 'Formal & delicate garments',
    keyLine: 'Expert care for suits, silk, cashmere',
    from: 'From ₹149/item',
    gradient: 'from-[#4A5A6B] via-[#374860] to-[#1B2A3B]',
    texture: 'radial-gradient(ellipse at 70% 25%, rgba(168,216,240,0.15) 0%, transparent 55%)',
    badge: 'Popular',
  },
  {
    icon: '🔥',
    name: 'Ironing',
    problem: 'Crisp office wear',
    keyLine: 'Pressed and hung, ready to wear',
    from: 'From ₹25/item',
    gradient: 'from-[#3B9FE5] via-[#2E86DE] to-[#1A6FC4]',
    texture: 'radial-gradient(ellipse at 60% 20%, rgba(255,255,255,0.12) 0%, transparent 55%)',
    badge: null,
  },
];

const EXTRA = [
  {
    icon: '👔',
    name: 'Wash & Iron',
    problem: 'Formal office wear',
    keyLine: 'Washed and perfectly pressed for formal and office wear.',
    from: '₹69 / kg',
    color: 'bg-[#F0F8FF] border-[#A8D8F0]',
    iconBg: 'bg-[#A8D8F0]',
  },
  {
    icon: '👟',
    name: 'Shoe Cleaning',
    problem: 'Sneakers & leather',
    keyLine: 'Looking box-fresh again — soles, uppers, and laces.',
    from: 'From ₹99/pair',
    color: 'bg-[#F0F8FF] border-[#A8D8F0]',
    iconBg: 'bg-[#A8D8F0]',
  },
  {
    icon: '🛏️',
    name: 'Duvet & Bedding',
    problem: 'Bulky items',
    keyLine: 'Industrial machines, domestic care — duvets done right.',
    from: 'From ₹199/item',
    color: 'bg-[#F0F8FF] border-[#A8D8F0]',
    iconBg: 'bg-[#A8D8F0]',
  },
  {
    icon: '⚡',
    name: 'Express Service',
    problem: 'Need it fast',
    keyLine: '24-hour turnaround. Same-day pickup when it matters.',
    from: '1.5× standard rate',
    color: 'bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100',
    badge: 'Fast',
  },
];

const PILLS = [
  { icon: '⚡', label: 'Express 24hr' },
  { icon: '📍', label: 'Live Tracking' },
  { icon: '📦', label: 'Safe Packaging' },
  { icon: '🚗', label: 'Free Pickup' },
  { icon: '🌿', label: 'Eco-Friendly' },
];

export function Services() {
  return (
    <section id="services" className="py-24" style={{ background: '#F0F8FF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
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
            What We Offer
          </h2>
          <p className="max-w-xl mx-auto" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4A5A6B' }}>
            From everyday laundry to delicate garments — every item handled with professional care and returned on time.
          </p>
        </div>

        {/* Featured 3-card row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {SERVICES.map((svc, idx) => (
            <div
              key={svc.name}
              className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${svc.gradient} group shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up`}
              style={{ minHeight: '300px', animationDelay: `${idx * 0.1}s` }}
            >
              <div className="absolute inset-0" style={{ background: svc.texture }} />
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 8px)' }} />
              {svc.badge && (
                <span className="absolute top-4 right-4 z-10 bg-white/95 text-[#1A6FC4] text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {svc.badge}
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl mb-4 border border-white/30 group-hover:bg-white/30 transition-all">
                  {svc.icon}
                </div>
                <p className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-1">{svc.problem}</p>
                <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{svc.name}</h3>
                <p className="text-white/80 text-sm mb-4 leading-relaxed">{svc.keyLine}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/20">
                  <span className="text-white font-semibold text-sm">{svc.from}</span>
                  <Link href="/login">
                    <button className="text-white/90 hover:text-white text-sm font-semibold bg-white/15 hover:bg-white/25 border border-white/25 hover:border-white/40 px-4 py-2 rounded-lg transition-all duration-200">
                      Book Now →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Extra services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {EXTRA.map((svc, idx) => (
            <div
              key={svc.name}
              className={`relative rounded-xl border p-6 flex items-start gap-4 hover:shadow-md transition-all duration-200 group animate-fade-in-up ${svc.color}`}
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              {'badge' in svc && svc.badge && (
                <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{svc.badge}</span>
              )}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${svc.iconBg} group-hover:scale-110 transition-transform`}>
                {svc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#8FA3B1' }}>{svc.problem}</p>
                <h3 className="font-bold mb-1" style={{ color: '#1B2A3B', fontFamily: 'var(--font-heading)', fontSize: '17px' }}>{svc.name}</h3>
                <p className="text-sm leading-relaxed mb-2" style={{ color: '#4A5A6B' }}>{svc.keyLine}</p>
                <p className="text-sm font-semibold" style={{ color: '#1A6FC4' }}>{svc.from}</p>
              </div>
              <Link href="/login" className="flex-shrink-0 self-center">
                <button className="text-sm font-semibold transition-colors hover:underline" style={{ color: '#2E86DE' }}>
                  Book →
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {PILLS.map((pill, idx) => (
            <div
              key={pill.label}
              className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200 animate-fade-in-up border hover:border-[#1A6FC4] hover:text-[#1A6FC4]"
              style={{
                borderColor: '#A8D8F0',
                color: '#4A5A6B',
                background: 'white',
                animationDelay: `${idx * 0.05}s`,
              }}
            >
              <span>{pill.icon}</span>
              {pill.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
