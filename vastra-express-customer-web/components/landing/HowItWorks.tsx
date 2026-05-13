import { CalendarDays, PackageCheck, Truck } from 'lucide-react';

const STEPS = [
  {
    Icon: CalendarDays,
    step: '01',
    title: 'Schedule',
    description: 'Pick your date, time, and services online in 2 minutes. No calls needed.',
  },
  {
    Icon: Truck,
    step: '02',
    title: 'We Collect',
    description: 'Our team arrives at your door with a fresh laundry bag — you hand it over and relax.',
  },
  {
    Icon: PackageCheck,
    step: '03',
    title: 'Delivered Clean',
    description: 'Clothes returned folded, fresh, and on time — guaranteed. Track every step live.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#07111C] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="kicker-chip border border-white/10 bg-white/5 text-[#4EAEE5]">
            How It Works
          </span>
          <h2
            className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Three Simple Steps
          </h2>
          <p className="mt-5 text-base leading-8 text-white/80">
            Schedule a pickup, we clean professionally, you get fresh clothes back at your door.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ Icon, step, title, description }) => (
            <article key={step} className="lively-card border border-white/10 bg-white/5 p-5 text-center shadow-sm backdrop-blur transition-all hover:border-[#4EAEE5]">
              <div className="icon-pop mx-auto flex h-12 w-12 items-center justify-center rounded-[8px] bg-white/5 text-[#4EAEE5] shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-bold uppercase text-[#4EAEE5]">Step {step}</p>
              <h3 className="mt-2 text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-white/70">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#services"
            className="inline-flex rounded-[8px] bg-[#4EAEE5] px-7 py-3 text-sm font-extrabold text-[#07111C] shadow-brand transition-all duration-200 hover:-translate-y-1 hover:bg-[#63BCEE] hover:shadow-lively"
          >
            View All Services →
          </a>
        </div>
      </div>
    </section>
  );
}
