import Link from 'next/link';

export function CTABanner() {
  return (
    <section
      className="py-20 relative overflow-hidden"
      style={{ background: '#1A6FC4' }}
    >
      {/* Bubble decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 right-0 rounded-full"
          style={{ width: '320px', height: '320px', background: 'rgba(255,255,255,0.05)', transform: 'translate(30%, -40%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute bottom-0 left-0 rounded-full"
          style={{ width: '480px', height: '480px', background: 'rgba(255,255,255,0.05)', transform: 'translate(-30%, 40%)', filter: 'blur(40px)' }}
        />
        {/* Decorative bubble dots */}
        {[
          { size: 60, top: '12%', left: '8%', delay: '0s', opacity: 0.15 },
          { size: 36, top: '60%', left: '4%', delay: '0.8s', opacity: 0.12 },
          { size: 22, top: '80%', left: '15%', delay: '1.6s', opacity: 0.1 },
          { size: 44, top: '15%', right: '6%', delay: '0.4s', opacity: 0.12 },
          { size: 24, bottom: '20%', right: '12%', delay: '1.2s', opacity: 0.1 },
        ].map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.size,
              height: b.size,
              top: b.top,
              left: ('left' in b) ? b.left : undefined,
              right: ('right' in b) ? b.right : undefined,
              bottom: ('bottom' in b) ? b.bottom : undefined,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), rgba(168,216,240,0.3))',
              border: '1.5px solid rgba(255,255,255,0.25)',
              opacity: b.opacity,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Urgency label */}
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 animate-fade-in-up"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <span className="w-2 h-2 bg-[#F5A623] rounded-full animate-pulse" />
          Limited slots today — book yours before they fill
        </div>

        {/* Headline */}
        <h2
          className="mb-4 tracking-tight animate-fade-in-up"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: 'white',
            lineHeight: '1.15',
            animationDelay: '0.1s',
          }}
        >
          First order? Get 20% off your pickup.
        </h2>

        <p
          className="mb-8 max-w-2xl mx-auto animate-fade-in-up"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '17px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: '1.8',
            animationDelay: '0.2s',
          }}
        >
          No code needed. Book your pickup for tomorrow and save on all services.
        </p>

        {/* Single bold CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link href="/login">
            <button
              className="px-10 py-4 font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl text-base"
              style={{
                background: 'white',
                color: '#1A6FC4',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              Book Your Pickup Now →
            </button>
          </Link>
          <a href="#services">
            <button
              className="px-10 py-4 font-semibold rounded-lg transition-all duration-200 hover:bg-white/10 text-base"
              style={{
                border: '2px solid rgba(255,255,255,0.6)',
                color: 'white',
                fontFamily: 'var(--font-ui)',
              }}
            >
              Explore Services
            </button>
          </a>
        </div>

        {/* Trust footer */}
        <p
          className="text-sm animate-fade-in-up"
          style={{ color: 'rgba(255,255,255,0.65)', animationDelay: '0.4s' }}
        >
          ✓ No subscription required &nbsp;·&nbsp; ✓ Cancel anytime &nbsp;·&nbsp; ✓ Instant refund policy
        </p>
      </div>
    </section>
  );
}
