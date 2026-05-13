import { Quote, Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Rajesh Kumar',
    location: 'Koregaon Park, Pune',
    rating: 5,
    text: "They picked up at 8am and it was back by 7pm the same day. Incredible. I was sceptical but now I won't go back to the laundromat.",
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
    <section id="testimonials" className="bg-[#0C1A2F] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="kicker-chip border border-white/10 bg-white/5 text-[#4EAEE5]">
            Customer Reviews
          </span>
          <h2
            className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Why They Choose Us
          </h2>
          <p className="mt-5 text-base leading-8 text-white/80">
            Real feedback from real customers who trust Vastra Express with their clothes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <article key={item.name} className="lively-card border border-white/10 bg-[#07111C] p-6 shadow-sm transition-all hover:border-[#4EAEE5]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex gap-1 text-[#F5A623]">
                  {Array.from({ length: item.rating }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-[#4EAEE5]">{item.objection}</span>
              </div>

              <Quote className="h-8 w-8 text-[#4EAEE5]" />
              <p className="mt-4 min-h-36 text-sm leading-7 text-white/80">{item.text}</p>

              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4EAEE5] text-sm font-bold text-[#07111C]">
                  {item.avatar}
                </div>
                <div>
                  <p className="font-bold text-white">{item.name}</p>
                  <p className="text-sm text-white/60">{item.location}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-white/70">
          Join 500+ happy customers across Pune and Mumbai.
        </p>
      </div>
    </section>
  );
}
