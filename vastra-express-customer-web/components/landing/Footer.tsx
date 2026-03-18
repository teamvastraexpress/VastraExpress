import Link from 'next/link';
import { Twitter, Facebook, Instagram, Youtube } from 'lucide-react';

const SOCIAL = [
  { Icon: Twitter, href: '#', label: 'Twitter' },
  { Icon: Facebook, href: '#', label: 'Facebook' },
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Youtube, href: '#', label: 'YouTube' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: '#1B2A3B', color: '#8FA3B1' }} className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Column 1: Logo + tagline + social */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <svg width="44" height="44" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="50" r="18" stroke="#4EAEE5" strokeWidth="12" fill="none" strokeLinecap="round"/>
                <path d="M 85 68 Q 100 75 115 68" stroke="#4EAEE5" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 80 68 Q 70 90 75 120" stroke="#A8D8F0" strokeWidth="14" fill="none" strokeLinecap="round"/>
                <text x="100" y="160" fontFamily="Arial, sans-serif" fontSize="80" fontWeight="bold" textAnchor="middle" fill="#4EAEE5">V</text>
                <text x="155" y="160" fontFamily="Arial, sans-serif" fontSize="80" fontWeight="bold" textAnchor="middle" fill="#A8D8F0">X</text>
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-base" style={{ color: 'white' }}>Vastra</span>
                <span className="font-extrabold text-sm" style={{ color: '#4EAEE5' }}>Express</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#8FA3B1' }}>
              Premium laundry care at your doorstep. Fresh clothes, on time, every time.
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-[#1A6FC4] hover:border-[#1A6FC4]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: '#8FA3B1' }} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div>
            <h4 className="font-semibold mb-5 text-xs uppercase tracking-widest" style={{ color: 'white' }}>
              Services
            </h4>
            <ul className="space-y-3 text-sm">
              {['Wash & Fold', 'Wash & Iron', 'Dry Cleaning', 'Iron Only', 'Shoe Cleaning', 'Express Service'].map((s) => (
                <li key={s}>
                  <Link
                    href="/login"
                    className="font-medium transition-colors duration-200 hover:text-[#4EAEE5]"
                    style={{ color: '#8FA3B1' }}
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="font-semibold mb-5 text-xs uppercase tracking-widest" style={{ color: 'white' }}>
              Contact
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://wa.me/918800000000"
                  className="flex items-center gap-2 transition-colors duration-200 hover:text-[#4EAEE5] font-medium"
                  style={{ color: '#8FA3B1' }}
                >
                  <span>💬</span> WhatsApp Us
                </a>
              </li>
              <li>
                <a
                  href="tel:+918800000000"
                  className="flex items-center gap-2 transition-colors duration-200 hover:text-[#4EAEE5] font-medium"
                  style={{ color: '#8FA3B1' }}
                >
                  <span>📞</span> +91 88000 00000
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@vastraexpress.in"
                  className="flex items-center gap-2 transition-colors duration-200 hover:text-[#4EAEE5] font-medium"
                  style={{ color: '#8FA3B1' }}
                >
                  <span>📧</span> support@vastraexpress.in
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">🕐</span>
                <span style={{ color: '#8FA3B1' }}>Mon–Sat, 7am–9pm</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">📍</span>
                <span style={{ color: '#8FA3B1' }}>Pune & Mumbai, Maharashtra</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust badges */}
          <div>
            <h4 className="font-semibold mb-5 text-xs uppercase tracking-widest" style={{ color: 'white' }}>
              Trust &amp; Safety
            </h4>
            <div className="space-y-3">
              {[
                { icon: '⭐', label: '4.9/5 on Google Reviews' },
                { icon: '🌿', label: 'Eco-Certified Detergents' },
                { icon: '🔒', label: 'Secure Payments' },
                { icon: '🛡️', label: 'Fabric-Safe Guarantee' },
                { icon: '✅', label: 'Background-Verified Staff' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span>{icon}</span>
                  <span className="text-sm font-medium" style={{ color: '#8FA3B1' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t mb-8" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Bottom strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: '#4A5A6B' }}>
          <p>© {year} Vastra Express. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map((l) => (
              <a
                key={l}
                href="#"
                className="font-medium transition-colors duration-200 hover:text-[#4EAEE5]"
                style={{ color: '#4A5A6B' }}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
