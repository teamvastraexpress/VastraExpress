import { CalendarDays, Truck, PackageCheck } from 'lucide-react';

const STEPS = [
  {
    Icon: CalendarDays,
    step: '01',
    title: 'Schedule',
    description: 'Pick your date, time, and services online in 2 minutes. No calls needed.',
    iconBg: '#E8F4FB',
    iconColor: '#1A6FC4',
    borderColor: '#A8D8F0',
    dotColor: '#1A6FC4',
  },
  {
    Icon: Truck,
    step: '02',
    title: 'We Collect',
    description: 'Our team arrives at your door with a fresh laundry bag — you hand it over and relax.',
    iconBg: '#EEF0FF',
    iconColor: '#4A5A6B',
    borderColor: '#C5CAE9',
    dotColor: '#4A5A6B',
  },
  {
    Icon: PackageCheck,
    step: '03',
    title: 'Delivered Clean',
    description: 'Clothes returned folded, fresh, and on time — guaranteed. Track every step live.',
    iconBg: '#E8F8F0',
    iconColor: '#1A6FC4',
    borderColor: '#A8D8C0',
    dotColor: '#22c55e',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{ background: '#E8F4FB', color: '#1A6FC4' }}
          >
            How It Works
          </span>
          <h2
            className="mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 700, color: '#1A6FC4' }}
          >
            Three Simple Steps
          </h2>
          <p
            className="max-w-lg mx-auto"
            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4A5A6B' }}
          >
            Schedule a pickup, we clean professionally, you get fresh clothes back at your door.
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map(({ Icon, step, title, description, iconBg, iconColor, borderColor }, idx) => (
            <div
              key={step}
              className="relative flex flex-col items-center text-center animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              {/* Dashed connector arrow — desktop only */}
              {idx < STEPS.length - 1 && (
                <div className="hidden sm:flex absolute top-12 left-[calc(50%+3.5rem)] right-0 items-center pointer-events-none z-0" style={{ width: 'calc(100% - 7rem)' }}>
                  <svg width="100%" height="24" viewBox="0 0 120 24" fill="none" preserveAspectRatio="none">
                    <path d="M0 12 Q30 4, 60 12 Q90 20, 120 12" stroke="#A8D8F0" strokeWidth="2" strokeDasharray="5 4" fill="none" />
                    <path d="M110 7 L120 12 L110 17" stroke="#A8D8F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}

              {/* Card */}
              <div
                className="relative z-10 w-full rounded-2xl p-8 group hover:-translate-y-1 transition-all duration-200 border hover:shadow-brand-lg"
                style={{
                  background: 'white',
                  borderColor: borderColor,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                {/* Step label */}
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: '#8FA3B1' }}
                >
                  Step {step}
                </div>

                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: iconBg }}
                >
                  <Icon className="w-8 h-8" style={{ color: iconColor }} />
                </div>

                <h3
                  className="mb-3"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: '#1B2A3B' }}
                >
                  {title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#4A5A6B', lineHeight: '1.7' }}>
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-14">
          <a
            href="#services"
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: '#1A6FC4',
              color: 'white',
              boxShadow: '0 4px 16px rgba(26,111,196,0.30)',
              fontFamily: 'var(--font-ui)',
              fontSize: '14px',
            }}
          >
            View All Services →
          </a>
        </div>
      </div>
    </section>
  );
}
