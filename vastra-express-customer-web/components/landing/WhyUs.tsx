const REASONS = [
  {
    icon: '🛡️',
    accent: 'border-blue-400',
    title: 'Trusted & Verified',
    description:
      'All our drivers and facility staff are background-verified. Your clothes are safe with us.',
  },
  {
    icon: '🧫',
    accent: 'border-teal-400',
    title: 'Hygienic Processing',
    description:
      'Industrial-grade machines, clean water, and hygiene protocols ensure spotless results.',
  },
  {
    icon: '⏰',
    accent: 'border-indigo-400',
    title: 'On-Time, Every Time',
    description:
      'We respect your schedule. Pickup and delivery slots are honored without fail.',
  },
  {
    icon: '📊',
    accent: 'border-violet-400',
    title: 'Transparent Billing',
    description:
      'Know exactly what you pay. Itemised bills, no surprise charges, GST shown clearly.',
  },
  {
    icon: '📍',
    accent: 'border-orange-400',
    title: 'Real-Time Tracking',
    description:
      'Track your order through every step — from pickup to delivery — in real time.',
  },
  {
    icon: '📞',
    accent: 'border-green-400',
    title: 'Dedicated Support',
    description:
      'Our customer care team is available to help you with any query or concern.',
  },
];

const STATS = [
  { value: '10,000+', label: 'Orders Completed' },
  { value: '98%', label: 'On-Time Delivery' },
  { value: '4.8★', label: 'Customer Rating' },
  { value: '24h', label: 'Express Turnaround' },
];

export function WhyUs() {
  return (
    <section id="why-us" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-block bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            The Vastra Express Difference
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            We don't just clean clothes — we deliver peace of mind.
          </p>
        </div>

        {/* Reason cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className={`bg-white rounded-2xl border-l-4 ${r.accent} border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="text-3xl mb-3">{r.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{r.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-8">
          {STATS.map((stat, i) => (
            <div key={stat.label} className={`text-center ${i < STATS.length - 1 ? 'sm:border-r border-gray-100' : ''}`}>
              <p className="text-3xl font-extrabold text-blue-600 tracking-tight">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

