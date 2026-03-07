import { CalendarDays, Sparkles, PackageCheck } from 'lucide-react';

const STEPS = [
  {
    Icon: CalendarDays,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-100',
    dotColor: 'bg-blue-600',
    step: '01',
    title: 'Schedule Pickup',
    description:
      'Choose your address, pick a time slot that suits your day, and select a service. Done in under 2 minutes.',
  },
  {
    Icon: Sparkles,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    borderColor: 'border-violet-100',
    dotColor: 'bg-violet-600',
    step: '02',
    title: 'We Clean',
    description:
      'Our driver collects your clothes. Our facility professionals clean and fold them with industrial-grade care.',
  },
  {
    Icon: PackageCheck,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-100',
    dotColor: 'bg-emerald-600',
    step: '03',
    title: 'Delivered Fresh',
    description:
      'Your laundry is delivered back to your door — neatly packed, on time, and hygienic every single time.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            As Easy as 1 – 2 – 3
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-lg">
            Book in minutes. We handle everything else.
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map(({ Icon, iconBg, iconColor, borderColor, step, title, description }, idx) => (
            <div key={step} className="relative flex flex-col items-center text-center">

              {/* Arrow connector — desktop only */}
              {idx < STEPS.length - 1 && (
                <div className="hidden sm:flex absolute top-10 left-[calc(50%+4.5rem)] right-0 items-center justify-center pointer-events-none z-0" style={{ width: 'calc(100% - 1rem)', left: 'calc(50% + 5rem)' }}>
                  <svg width="80" height="24" viewBox="0 0 80 24" fill="none" className="text-gray-300">
                    <path
                      d="M0 12 Q20 4, 40 12 Q60 20, 80 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      fill="none"
                    />
                    <path d="M72 7 L80 12 L72 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}

              {/* Card */}
              <div className={`relative z-10 w-full bg-white rounded-2xl border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-200 p-7`}>
                {/* Step label */}
                <div className="text-xs font-bold text-gray-300 tracking-widest mb-4">STEP {step}</div>

                {/* Icon */}
                <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                  <Icon className={`w-8 h-8 ${iconColor}`} />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

