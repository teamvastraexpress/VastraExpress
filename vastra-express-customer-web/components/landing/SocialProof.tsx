import { Clock3, MapPin, PackageCheck, Star } from 'lucide-react';

const STATS = [
  { value: '4.9★', label: 'Rating on Google', Icon: Star },
  { value: '2,000+', label: 'Orders Completed', Icon: PackageCheck },
  { value: '24hr', label: 'Express Turnaround', Icon: Clock3 },
  { value: '98%', label: 'On-Time Delivery', Icon: MapPin },
];

export function SocialProof() {
  return (
    <section className="border-y border-white/10 bg-[#07111C]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map(({ value, label, Icon }) => (
            <div
              key={label}
              className="lively-card flex items-center gap-3 border border-white/10 bg-white/5 px-4 py-4 shadow-sm backdrop-blur"
            >
              <span className="icon-pop flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-white/5 text-[#4EAEE5]">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p
                  className="text-xl font-extrabold leading-none text-[#4EAEE5]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {value}
                </p>
                <p className="mt-1 text-sm font-medium text-white/80">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
