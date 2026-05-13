const GALLERY_IMAGES = [
  {
    src: '/VD_3.jpeg',
    title: 'Freshly Folded',
    subtitle: 'Neat stacks, ready to wear',
  },
  {
    src: '/VD_2.jpeg',
    title: 'Careful Handling',
    subtitle: 'Fabric-safe processing, every item',
  },
  {
    src: '/VD_5.jpeg',
    title: 'Professional Ironing',
    subtitle: 'Crisp results, pressed to perfection',
  },
  {
    src: '/VD_6.jpeg',
    title: 'Colour Protection',
    subtitle: 'Whites bright, colours preserved',
  },
  {
    src: '/VD_4.jpeg',
    title: 'Doorstep Pickup',
    subtitle: 'Scheduled for your convenience',
  },
  {
    src: '/VD_1.png',
    title: 'Premium Finish',
    subtitle: 'Packed clean, delivered on time',
  },
];

export function Gallery() {
  return (
    <section id="gallery" className="bg-[#07111C] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="kicker-chip border border-white/10 bg-white/5 text-[#4EAEE5]">
            Inside Vastra Express
          </span>
          <h2
            className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Real Laundry. Real Results.
          </h2>
          <p className="mt-5 text-base leading-8 text-white/80">
            A look at the quality standards behind every pickup, wash, press, and delivery.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {GALLERY_IMAGES.map((item) => (
            <article
              key={item.title}
              className="lively-card group relative h-44 border border-white/10 bg-white/5 shadow-sm sm:h-56 md:h-64"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                aria-label={item.title}
                role="img"
                style={{ backgroundImage: `url(${item.src})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07111C]/90 via-[#07111C]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="text-sm font-bold sm:text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-white/80 sm:text-sm">{item.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
