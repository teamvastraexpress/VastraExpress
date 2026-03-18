'use client';

import Link from 'next/link';

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #E8F4FB 0%, #F5FAFE 100%)',
        minHeight: '88vh',
      }}
    >
      {/* Bubble decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-left cluster */}
        <div className="bubble bubble--xl absolute" style={{ top: '8%', left: '3%', animationDelay: '0s', opacity: 0.35 }} />
        <div className="bubble bubble--md absolute" style={{ top: '18%', left: '9%', animationDelay: '0.8s', opacity: 0.25 }} />
        <div className="bubble bubble--sm absolute" style={{ top: '28%', left: '5%', animationDelay: '1.6s', opacity: 0.2 }} />
        {/* Top-right single large */}
        <div className="bubble bubble--xl absolute" style={{ top: '5%', right: '4%', animationDelay: '0.4s', opacity: 0.3 }} />
        {/* Bottom-left scattered */}
        <div className="bubble bubble--lg absolute" style={{ bottom: '16%', left: '2%', animationDelay: '1.2s', opacity: 0.25 }} />
        <div className="bubble bubble--md absolute" style={{ bottom: '28%', left: '14%', animationDelay: '2s', opacity: 0.2 }} />
        <div className="bubble bubble--sm absolute" style={{ bottom: '10%', left: '22%', animationDelay: '0.6s', opacity: 0.2 }} />
        {/* Right side */}
        <div className="bubble bubble--md absolute" style={{ top: '44%', right: '6%', animationDelay: '1.8s', opacity: 0.2 }} />
        <div className="bubble bubble--sm absolute" style={{ bottom: '20%', right: '10%', animationDelay: '2.4s', opacity: 0.18 }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" style={{ minHeight: '88vh' }}>

          {/* ── LEFT: Copy ── */}
          <div className="py-20 lg:py-28 flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* Availability badge */}
            <div
              className="inline-flex items-center gap-2 bg-white border border-[#A8D8F0] px-4 py-2 rounded-full text-sm font-semibold text-[#1A6FC4] mb-8 animate-fade-in-up shadow-sm"
              style={{ animationDelay: '0s' }}
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Now available in your city
            </div>

            {/* Headline — outcome-led per content plan */}
            <h1
              className="font-extrabold leading-[1.1] tracking-tight mb-5 animate-fade-in-up"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
                color: '#1A6FC4',
                letterSpacing: '-0.02em',
                animationDelay: '0.1s',
              }}
            >
              Fresh Clothes,<br />
              <span style={{ color: '#1B2A3B' }}>Delivered to</span><br />
              Your Door
            </h1>

            {/* Subheadline — addresses core pain point */}
            <p
              className="mb-8 animate-fade-in-up max-w-md"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '17px',
                color: '#4A5A6B',
                lineHeight: '1.8',
                animationDelay: '0.2s',
              }}
            >
              Skip the trips, skip the stress — we pick up, clean, and return within 24 hours. Same-day slots available.
            </p>

            {/* Primary CTA — single button */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in-up w-full sm:w-auto" style={{ animationDelay: '0.3s' }}>
              <Link href="/login">
                <button className="btn-primary text-base px-9 py-3.5 w-full sm:w-auto">
                  Schedule Free Pickup
                </button>
              </Link>
              <a href="#pricing">
                <button className="btn-secondary text-base px-9 py-3.5 w-full sm:w-auto">
                  View Pricing
                </button>
              </a>
            </div>

            {/* Trust micro-copy */}
            <div
              className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-sm animate-fade-in-up"
              style={{ color: '#8FA3B1', animationDelay: '0.4s' }}
            >
              <span>No subscription needed</span>
              <span className="hidden sm:inline" style={{ color: '#A8D8F0' }}>·</span>
              <span>500+ happy customers</span>
              <span className="hidden sm:inline" style={{ color: '#A8D8F0' }}>·</span>
              <span>Same-day slots available</span>
            </div>
          </div>

          {/* ── RIGHT: Phone mockup ── */}
          <div className="relative flex items-center justify-center pb-16 lg:py-20">
            {/* Glow halo */}
            <div
              className="absolute rounded-full blur-3xl pointer-events-none"
              style={{
                width: '340px',
                height: '340px',
                background: 'radial-gradient(circle, rgba(78,174,229,0.22) 0%, transparent 70%)',
              }}
            />

            {/* Floating stat chips */}
            <div
              className="absolute -left-4 xl:-left-16 top-16 hidden sm:block rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#8FA3B1' }}>Avg. Delivery</p>
              <p className="text-xl font-extrabold" style={{ color: '#1A6FC4', lineHeight: '1.2' }}>24 Hours</p>
            </div>

            <div
              className="absolute -right-4 xl:-right-16 bottom-24 hidden sm:block rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm animate-fade-in-up"
              style={{ animationDelay: '0.65s' }}
            >
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#8FA3B1' }}>Customer Rating</p>
              <p className="text-xl font-extrabold" style={{ color: '#1A6FC4', lineHeight: '1.2' }}>4.9 / 5 ⭐</p>
            </div>

            {/* Phone frame */}
            <div
              className="relative rounded-[2.8rem] overflow-hidden shadow-[0_32px_80px_rgba(26,111,196,0.18)] border border-white/20 animate-ve-float-slow"
              style={{ width: '272px', height: '548px', background: '#1C1C2E' }}
            >
              {/* Dynamic island */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 rounded-b-full z-20 border-b border-l border-r border-white/5" style={{ background: '#1C1C2E' }} />

              {/* Status bar */}
              <div className="flex justify-between items-center px-6 pt-4 pb-1.5">
                <span className="text-white text-xs font-semibold">9:41</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-[2px] items-end h-3">
                    {[2, 3, 4, 3].map((h, i) => (
                      <div key={i} className="w-[2px] bg-white/70 rounded-sm" style={{ height: `${h * 3}px` }} />
                    ))}
                  </div>
                  <div className="w-5 h-2.5 border border-white/40 rounded-sm flex items-center px-0.5">
                    <div className="w-3 h-1.5 bg-white/50 rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* App screen */}
              <div className="bg-white mx-2 rounded-[1.8rem] overflow-hidden relative" style={{ height: '488px' }}>

                {/* App top bar */}
                <div className="px-4 pt-4 pb-12" style={{ background: '#1A6FC4' }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Vastra Express</span>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-xs">🔔</span>
                    </div>
                  </div>
                  <p className="text-white font-bold text-sm leading-snug">
                    Laundry Picked Up.<br />Delivered Fresh.
                  </p>
                  <div className="flex gap-1.5 mt-2.5">
                    <span className="bg-white text-[#1A6FC4] text-xs px-3 py-1 rounded-full font-bold shadow-sm">Book Pickup</span>
                    <span className="border border-blue-300/60 text-white text-xs px-3 py-1 rounded-full">Track Order</span>
                  </div>
                </div>

                {/* Map */}
                <div className="mx-3 -mt-8 rounded-2xl bg-slate-100 overflow-hidden shadow-lg relative" style={{ height: '148px' }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.22) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 148" preserveAspectRatio="none">
                    <path d="M25 122 C55 104, 90 65, 138 52 S195 36, 218 28" stroke="#1A6FC4" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75" />
                    <circle cx="25" cy="122" r="5" fill="#f97316" />
                    <circle cx="218" cy="28" r="5" fill="#22c55e" />
                  </svg>
                  <div className="absolute w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style={{ top: '37%', left: '41%', background: '#1A6FC4' }}>
                    <span className="text-sm">🚚</span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Real Time Tracking</p>
                      <p className="text-[10px] text-slate-400">Delivering to your address</p>
                    </div>
                    <span className="text-[10px]">📍</span>
                  </div>
                </div>

                {/* Active order row */}
                <div className="mx-3 mt-2.5 rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-blue-100" style={{ background: '#E8F4FB' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: '#A8D8F0' }}>👕</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">Wash &amp; Fold · 3.2 kg</p>
                    <p className="text-[11px] font-medium" style={{ color: '#1A6FC4' }}>In transit · On time</p>
                  </div>
                  <span className="text-[10px] text-green-600 font-bold bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Live</span>
                </div>

                {/* Bottom nav */}
                <div className="absolute bottom-2 left-2 right-2 bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-2.5 flex justify-around items-center">
                  {[{ icon: '🏠', active: true }, { icon: '📋', active: false }, { icon: '🔔', active: false }, { icon: '👤', active: false }].map((item, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center ${item.active ? 'bg-blue-100' : ''}`}>
                      <span className="text-base">{item.icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave into SocialProof */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 52L1440 52L1440 18C1100 50 440 0 0 18L0 52Z" fill="white" />
        </svg>
      </div>

      <style jsx>{`
        .bubble {
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(74,174,229,0.2));
          border: 1.5px solid rgba(74,174,229,0.25);
          position: absolute;
          pointer-events: none;
          animation: float 4s ease-in-out infinite alternate;
        }
        .bubble--sm  { width: 18px;  height: 18px; }
        .bubble--md  { width: 36px;  height: 36px; }
        .bubble--lg  { width: 60px;  height: 60px; }
        .bubble--xl  { width: 90px;  height: 90px; }
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); }
          to   { transform: translateY(-12px) rotate(8deg); }
        }
      `}</style>
    </section>
  );
}
