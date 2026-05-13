import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Clock3,
  Download,
  Facebook,
  Instagram,
  Leaf,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Twitter,
  Youtube,
} from 'lucide-react';

const SOCIAL = [
  { Icon: Twitter, href: '#', label: 'Twitter' },
  { Icon: Facebook, href: '#', label: 'Facebook' },
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Youtube, href: '#', label: 'YouTube' },
];

const SERVICES = [
  'Wash & Fold',
  'Wash & Iron',
  'Dry Cleaning',
  'Iron Only',
  'Shoe Cleaning',
  'Express Service',
];

const TRUST_ITEMS = [
  { Icon: Star, label: '4.9/5 on Google Reviews' },
  { Icon: Leaf, label: 'Eco-Certified Detergents' },
  { Icon: Lock, label: 'Secure Payments' },
  { Icon: ShieldCheck, label: 'Fabric-Safe Guarantee' },
  { Icon: CheckCircle2, label: 'Background-Verified Staff' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#07111C] border-t border-white/10 text-[#8FA3B1]">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-5 flex items-center gap-3">
              <Image src="/vastra-logo.png" alt="Vastra Express" width={48} height={48} className="h-12 w-12 object-contain" />
              <div className="leading-tight">
                <span className="block text-base font-extrabold text-white">Vastra</span>
                <span className="block text-sm font-extrabold text-[#4EAEE5]">Express</span>
              </div>
            </Link>
            <p className="max-w-xs text-sm leading-7">
              Premium laundry care at your doorstep. Fresh clothes, on time, every time.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {SOCIAL.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-white/10 bg-white/5 transition-all hover:-translate-y-1 hover:border-[#4EAEE5] hover:bg-[#1A6FC4]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            
            <div className="mt-6">
              <button 
                type="button" 
                className="flex w-fit items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
              >
                <Download className="h-4 w-4" />
                Download the App
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold text-white">Services</h4>
            <ul className="space-y-3 text-sm">
              {SERVICES.map((service) => (
                <li key={service}>
                  <Link href="/pricing" className="font-medium transition-colors hover:text-[#4EAEE5]">
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold text-white">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="https://wa.me/918800000000" className="flex items-center gap-2 font-medium transition-colors hover:text-[#4EAEE5]">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </li>
              <li>
                <a href="tel:+918800000000" className="flex items-center gap-2 font-medium transition-colors hover:text-[#4EAEE5]">
                  <Phone className="h-4 w-4" />
                  +91 88000 00000
                </a>
              </li>
              <li>
                <a href="mailto:support@vastraexpress.in" className="flex items-center gap-2 font-medium transition-colors hover:text-[#4EAEE5]">
                  <Mail className="h-4 w-4" />
                  support@vastraexpress.in
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Mon–Sat, 7am–9pm</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Pune & Mumbai, Maharashtra</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold text-white">Trust &amp; Safety</h4>
            <div className="space-y-3">
              {TRUST_ITEMS.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm font-medium">
                  <Icon className="h-4 w-4 shrink-0 text-[#4EAEE5]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
            <p>© {year} Vastra Express. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-5">
              <a href="#" className="font-medium transition-colors hover:text-[#4EAEE5]">
                Privacy Policy
              </a>
              <a href="#" className="font-medium transition-colors hover:text-[#4EAEE5]">
                Terms of Service
              </a>
              <a href="#" className="font-medium transition-colors hover:text-[#4EAEE5]">
                Refund Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
