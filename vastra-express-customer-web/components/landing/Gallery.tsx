const GALLERY_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?auto=format&fit=crop&w=1200&q=80',
    title: 'Freshly Folded',
    subtitle: 'Neat stacks, ready to wear',
  },
  {
    src: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1200&q=80',
    title: 'Careful Handling',
    subtitle: 'Fabric-safe processing, every item',
  },
  {
    src: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=1200&q=80',
    title: 'Professional Ironing',
    subtitle: 'Crisp results, pressed to perfection',
  },
  {
    src: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=1200&q=80',
    title: 'Colour Protection',
    subtitle: 'Whites bright, colours preserved',
  },
  {
    src: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=1200&q=80',
    title: 'Doorstep Pickup',
    subtitle: 'Scheduled for your convenience',
  },
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
    title: 'Premium Finish',
    subtitle: 'Packed clean, delivered on time',
  },
];

export function Gallery() {
  return (
    <section id="gallery" className="py-24" style={{ background: '#F0F8FF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{ background: '#A8D8F0', color: '#1A6FC4' }}
          >
            Inside Vastra Express
          </span>
          <h2
            className="mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 700, color: '#1A6FC4' }}
          >
            Real Laundry. Real Results.
          </h2>
          <p
            className="max-w-2xl mx-auto"
            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#4A5A6B', lineHeight: '1.8' }}
          >
            A look at the quality standards behind every pickup, wash, press, and delivery.
          </p>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {GALLERY_IMAGES.map((item, index) => (
            <article
              key={item.title}
              className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                className="h-44 sm:h-56 md:h-64 w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute left-4 right-4 bottom-4 text-white">
                <h3
                  className="font-semibold text-sm sm:text-base"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/80">{item.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
