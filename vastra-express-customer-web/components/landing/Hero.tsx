'use client';

import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: '88vh' }}>

        {/* ── LEFT PANEL — Dark navy ── */}
        <div className="relative bg-[#0D1B3E] flex items-center">
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Blue glow orb */}
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-700/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 px-8 sm:px-12 lg:px-14 xl:px-16 py-20 lg:py-24 max-w-lg w-full">
            {/* Availability badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/25 px-4 py-1.5 rounded-full text-sm font-medium text-blue-300 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Now available in your city
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.07] tracking-tight mb-6 text-white">
              Laundry<br />
              <span className="text-blue-400">Picked Up.</span><br />
              Delivered<br />
              <span className="text-slate-300">Fresh.</span>
            </h1>

            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Same-day pickup · Professional cleaning<br />
              Doorstep delivery
            </p>

            {/* Pill CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/login">
                <button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3.5 rounded-full text-base transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-400/40 hover:-translate-y-0.5 active:translate-y-0">
                  Book a Pickup
                </button>
              </Link>
              <a href="#pricing">
                <button className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold px-8 py-3.5 rounded-full text-base transition-all duration-200 hover:bg-white/8">
                  See Pricing
                </button>
              </a>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>✓ No hidden charges</span>
              <span>✓ On-time delivery</span>
              <span>✓ Hygienic processing</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — Light / marble ── */}
        <div className="relative bg-slate-50 flex items-center justify-center overflow-hidden py-16 lg:py-0 min-h-[520px]">
          {/* Soft radial glow backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 65% 45%, rgba(219,234,254,0.55) 0%, rgba(241,245,249,0.25) 45%, transparent 70%)',
            }}
          />

          {/* Floating water-drop decorations */}
          <div className="absolute top-8 right-8 w-20 h-20 rounded-full bg-blue-100/70 border border-blue-200/50 animate-ve-float-slow" />
          <div className="absolute top-24 right-24 w-10 h-10 rounded-full bg-blue-200/50 border border-blue-300/40 animate-ve-float" />
          <div className="absolute bottom-14 left-8 w-16 h-16 rounded-full bg-indigo-100/60 border border-indigo-200/40 animate-ve-float-slow" style={{ animationDelay: '0.8s' }} />
          <div className="absolute bottom-28 right-6 w-8 h-8 rounded-full bg-blue-100/60 border border-blue-200/40 animate-ve-float" style={{ animationDelay: '1.4s' }} />
          <div className="absolute top-1/2 left-5 w-6 h-6 rounded-full bg-sky-100/50 border border-sky-200/40 animate-ve-float-slow" style={{ animationDelay: '2.2s' }} />

          {/* ─── Phone Mockup ─── */}
          <div className="relative z-10 flex-shrink-0">
            {/* Outer glow */}
            <div className="absolute -inset-8 bg-blue-200/25 rounded-[3.5rem] blur-3xl pointer-events-none" />

            {/* Phone frame */}
            <div
              className="relative bg-[#1C1C2E] rounded-[2.8rem] border border-white/10 shadow-[0_32px_80px_rgba(15,23,42,0.3)] overflow-hidden"
              style={{ width: '272px', height: '540px' }}
            >
              {/* Dynamic island */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-[#1C1C2E] rounded-b-full z-20 border-b border-l border-r border-white/5" />

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

              {/* White App screen */}
              <div className="bg-white mx-2 rounded-[1.8rem] overflow-hidden relative" style={{ height: '480px' }}>

                {/* App top bar — blue banner */}
                <div className="bg-blue-600 px-4 pt-4 pb-12">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                      Vastra Express
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-xs">🔔</span>
                    </div>
                  </div>
                  <p className="text-white font-bold text-sm leading-snug">
                    Laundry Picked Up.<br />Delivered Fresh.
                  </p>
                  <div className="flex gap-1.5 mt-2.5">
                    <span className="bg-white text-blue-600 text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                      Book Pickup
                    </span>
                    <span className="border border-blue-300/60 text-white text-xs px-3 py-1 rounded-full">
                      Track Order
                    </span>
                  </div>
                </div>

                {/* Map — overlaps banner with negative margin */}
                <div
                  className="mx-3 -mt-8 rounded-2xl bg-slate-100 overflow-hidden shadow-lg relative"
                  style={{ height: '148px' }}
                >
                  {/* Road grid */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.22) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                  {/* Route SVG */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 148" preserveAspectRatio="none">
                    <path
                      d="M25 122 C55 104, 90 65, 138 52 S195 36, 218 28"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.75"
                    />
                    <circle cx="25" cy="122" r="5" fill="#f97316" />
                    <circle cx="218" cy="28" r="5" fill="#22c55e" />
                  </svg>
                  {/* Truck icon */}
                  <div
                    className="absolute w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                    style={{ top: '37%', left: '41%' }}
                  >
                    <span className="text-sm">🚚</span>
                  </div>
                  {/* Info pill */}
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Real Time Order Tracking</p>
                      <p className="text-[10px] text-slate-400">Delivering to your address</p>
                    </div>
                    <div className="w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center">
                      <span className="text-[10px]">📍</span>
                    </div>
                  </div>
                </div>

                {/* Active order row */}
                <div className="mx-3 mt-2.5 bg-blue-50 rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    👕
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">Wash &amp; Fold · 3.2 kg</p>
                    <p className="text-[11px] text-blue-600 font-medium">In transit · On time</p>
                  </div>
                  <span className="text-[10px] text-green-600 font-bold bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    Live
                  </span>
                </div>

                {/* Bottom nav bar */}
                <div className="absolute bottom-2 left-2 right-2 bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-2.5 flex justify-around items-center">
                  {[
                    { icon: '🏠', active: true },
                    { icon: '📋', active: false },
                    { icon: '🔔', active: false },
                    { icon: '👤', active: false },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${item.active ? 'bg-blue-100' : 'hover:bg-slate-50'}`}
                    >
                      <span className="text-base">{item.icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width wave into next section */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 52L1440 52L1440 18C1100 50 440 0 0 18L0 52Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
