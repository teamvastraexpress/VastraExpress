export function SocialProof() {
  const stats = [
    { value: '4.9★', label: 'Rating on Google', icon: '⭐' },
    { value: '2,000+', label: 'Orders Completed', icon: '📦' },
    { value: '24hr', label: 'Express Turnaround', icon: '⚡' },
    { value: '98%', label: 'On-Time Delivery', icon: '⏱️' },
  ];

  return (
    <section className="py-5 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center sm:justify-between items-center gap-y-4 gap-x-6">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 px-4 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <span className="text-xl">{stat.icon}</span>
              <div>
                <span
                  className="font-extrabold text-lg leading-tight block"
                  style={{ color: '#1A6FC4', fontFamily: 'var(--font-heading)' }}
                >
                  {stat.value}
                </span>
                <span className="text-xs font-medium" style={{ color: '#4A5A6B' }}>
                  {stat.label}
                </span>
              </div>
              {idx < stats.length - 1 && (
                <div className="hidden sm:block w-px h-8 bg-gray-200 ml-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
