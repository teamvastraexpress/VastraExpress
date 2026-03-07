import Link from 'next/link';

/* Three hero service cards — photo-gradient style */
const FEATURED = [
  {
    icon: '🫧',
    name: 'Wash & Fold',
    tagline: 'Everyday laundry, done right',
    from: '₹49 / kg',
    gradient: 'from-blue-700 via-blue-800 to-indigo-900',
    texture: 'radial-gradient(ellipse at 30% 30%, rgba(147,197,253,0.2) 0%, transparent 55%)',
    badge: null,
  },
  {
    icon: '✨',
    name: 'Dry Clean',
    tagline: 'Premium care for delicate garments',
    from: '₹149 / item',
    gradient: 'from-slate-600 via-slate-700 to-slate-900',
    texture: 'radial-gradient(ellipse at 70% 25%, rgba(226,232,240,0.15) 0%, transparent 55%)',
    badge: 'Popular',
  },
  {
    icon: '🔥',
    name: 'Iron Only',
    tagline: 'Crisp and wrinkle-free, fast',
    from: '₹25 / item',
    gradient: 'from-amber-600 via-orange-700 to-orange-900',
    texture: 'radial-gradient(ellipse at 60% 20%, rgba(253,230,138,0.2) 0%, transparent 55%)',
    badge: null,
  },
];

/* Smaller additional services */
const EXTRA = [
  {
    icon: '👔',
    name: 'Wash & Iron',
    description: 'Washed and perfectly pressed for office and formal wear.',
    from: '₹69 / kg',
    color: 'bg-indigo-50 border-indigo-100',
    iconBg: 'bg-indigo-100',
  },
  {
    icon: '⚡',
    name: 'Express Service',
    description: '24-hour turnaround. Same-day pickup when you need it fast.',
    from: '1.5× rate',
    color: 'bg-orange-50 border-orange-100',
    iconBg: 'bg-orange-100',
    badge: 'Fast',
  },
];

/* Feature pills */
const PILLS = [
  { icon: '⚡', label: 'Express 24hr' },
  { icon: '📍', label: 'Live Tracking' },
  { icon: '📦', label: 'Safe Packaging' },
  { icon: '🚗', label: 'Free Pickup' },
];

export function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            What We Offer
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            From everyday laundry to delicate dry cleaning — handled with care, every time.
          </p>
        </div>

        {/* Featured 3-card photo-gradient row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          {FEATURED.map((svc) => (
            <div
              key={svc.name}
              className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${svc.gradient} group`}
              style={{ minHeight: '260px' }}
            >
              {/* Inner texture glow */}
              <div className="absolute inset-0" style={{ background: svc.texture }} />

              {/* Badge */}
              {svc.badge && (
                <span className="absolute top-4 right-4 z-10 bg-white/95 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {svc.badge}
                </span>
              )}

              {/* Fabric-texture overlay */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 8px)',
                }}
              />

              {/* Content — bottom anchored */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl mb-3 border border-white/20">
                  {svc.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-0.5">{svc.name}</h3>
                <p className="text-white/70 text-sm mb-3">{svc.tagline}</p>
                <div className="flex items-center justify-between">
                  <span className="text-white/90 text-sm font-semibold">From {svc.from}</span>
                  <Link href="/login">
                    <button className="text-white/80 hover:text-white text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full transition-all duration-200">
                      Book →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Extra services — smaller cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {EXTRA.map((svc) => (
            <div
              key={svc.name}
              className={`relative rounded-2xl border p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 ${svc.color}`}
            >
              {svc.badge && (
                <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {svc.badge}
                </span>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${svc.iconBg}`}>
                {svc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-0.5">{svc.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{svc.description}</p>
              </div>
              <div className="text-right flex-shrink-0 pl-2">
                <p className="text-sm font-semibold text-gray-700 mb-1">From {svc.from}</p>
                <Link href="/login">
                  <button className="text-blue-600 text-sm font-semibold hover:text-blue-800 transition-colors">
                    Book →
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Feature pills row */}
        <div className="flex flex-wrap justify-center gap-3">
          {PILLS.map((pill) => (
            <div
              key={pill.label}
              className="inline-flex items-center gap-2 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-700 text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-200 cursor-default"
            >
              <span className="text-base">{pill.icon}</span>
              {pill.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

