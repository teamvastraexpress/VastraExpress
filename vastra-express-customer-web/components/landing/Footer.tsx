import Link from 'next/link';
import { Twitter, Facebook, Instagram, Youtube, Sparkles } from 'lucide-react';

const SOCIAL = [
  { Icon: Twitter, href: '#', label: 'Twitter' },
  { Icon: Facebook, href: '#', label: 'Facebook' },
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Youtube, href: '#', label: 'YouTube' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400 relative overflow-hidden">
      {/* Decorative sparkle — top right */}
      <div className="absolute top-8 right-10 text-blue-800/40 pointer-events-none">
        <Sparkles className="w-10 h-10" />
      </div>
      {/* Decorative sparkle — bottom left */}
      <div className="absolute bottom-10 left-8 text-blue-900/30 pointer-events-none">
        <Sparkles className="w-6 h-6" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">✦</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Vastra Express</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 mb-6">
              Premium laundry service, delivered to your doorstep. Clean clothes, happy life.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors duration-200 group"
                >
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2.5 text-sm">
              {['Wash & Fold', 'Wash & Iron', 'Dry Clean', 'Iron Only', 'Express Service'].map((s) => (
                <li key={s}>
                  <Link href="/login" className="hover:text-white transition-colors duration-150">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'About Us', href: '#' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Careers', href: '#' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-white transition-colors duration-150">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:support@vastraexpress.in"
                  className="flex items-center gap-2 hover:text-white transition-colors duration-150"
                >
                  <span>📧</span>
                  support@vastraexpress.in
                </a>
              </li>
              <li>
                <a
                  href="tel:+918800000000"
                  className="flex items-center gap-2 hover:text-white transition-colors duration-150"
                >
                  <span>📞</span>
                  +91 88000 00000
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0">📍</span>
                <span>Mumbai, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800/70 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-gray-600">
            © {year} Vastra Express. All rights reserved.
          </p>
          <div className="flex gap-6 text-gray-600">
            <a href="#" className="hover:text-white transition-colors duration-150">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors duration-150">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors duration-150">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

