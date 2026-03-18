const TESTIMONIALS = [
  {
    name: 'Rajesh Kumar',
    location: 'Koregaon Park, Pune',
    rating: 5,
    text: 'They picked up at 8am and it was back by 7pm the same day. Incredible. I was sceptical but now I won\'t go back to the laundromat.',
    avatar: 'RK',
    objection: 'Speed',
  },
  {
    name: 'Priya Sharma',
    location: 'Bandra, Mumbai',
    rating: 5,
    text: 'My silk blouse came back perfectly — I was nervous sending it but it was immaculate. Expert handling, no damage, no fading.',
    avatar: 'PS',
    objection: 'Quality & Safety',
  },
  {
    name: 'Arjun Patel',
    location: 'Viman Nagar, Pune',
    rating: 5,
    text: 'Cheaper than doing it at the laundromat when you count the time and travel. Transparent billing, no surprises on the final amount.',
    avatar: 'AP',
    objection: 'Value for Money',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24" style={{ background: 'white' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{ background: '#FEF3C7', color: '#92400E' }}
          >
            Customer Reviews
          </span>
          <h2
            className="mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 700, color: '#1A6FC4' }}
          >
            Why They Choose Us
          </h2>
          <p className="max-w-xl mx-auto" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4A5A6B' }}>
            Real feedback from real customers who trust Vastra Express with their clothes.
          </p>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={t.name}
              className="rounded-2xl p-7 flex flex-col animate-fade-in-up hover:-translate-y-1 transition-all duration-200"
              style={{
                background: '#F7FBFF',
                border: '1px solid rgba(74,163,240,0.15)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                animationDelay: `${idx * 0.1}s`,
              }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} style={{ color: '#F5A623', fontSize: '16px' }}>★</span>
                ))}
              </div>

              {/* Large quote mark */}
              <div
                className="mb-3 font-serif leading-none select-none"
                style={{ fontSize: '48px', color: '#2176C7', opacity: 0.7, lineHeight: 1, fontFamily: 'Georgia, serif' }}
              >
                "
              </div>

              {/* Review text */}
              <p
                className="mb-6 flex-1"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4A5A6B', lineHeight: '1.8' }}
              >
                {t.text}
              </p>

              {/* Reviewer row */}
              <div
                className="flex items-center gap-3 pt-4"
                style={{ borderTop: '1px solid rgba(74,163,240,0.15)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1A6FC4', border: '2px solid #A8D8F0' }}
                >
                  <span className="text-white font-semibold text-xs">{t.avatar}</span>
                </div>
                <div className="min-w-0">
                  <p
                    className="font-semibold text-sm"
                    style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                  >
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: '#8FA3B1' }}>{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof footer */}
        <div className="text-center mt-12">
          <p style={{ color: '#4A5A6B', fontSize: '15px' }}>
            Join 500+ happy customers across Pune and Mumbai.
          </p>
        </div>
      </div>
    </section>
  );
}
