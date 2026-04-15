import type { Metadata } from 'next';
import { DM_Sans, Nunito, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const bodyFont = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
});

const headingFont = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

const displayFont = Nunito({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vastra Express — Premium Laundry at Your Doorstep',
  description:
    'Book laundry pickup online. Wash, Iron, Dry Clean — delivered back fresh. Transparent pricing, on-time service.',
  keywords: 'laundry service, laundry pickup, wash and fold, dry clean, iron service, Pune, Mumbai',
  openGraph: {
    title: 'Vastra Express — Premium Laundry Service',
    description: 'Book laundry pickup. Delivered back fresh.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} ${displayFont.variable}`}
      data-scroll-behavior="smooth"
    >
      {/*
        No bg-white / text-gray-900 on body — globals.css owns the
        background (#F7FBFF) and text (#1B2A3B) via design tokens.
      */}
      <body className={`${bodyFont.className} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              color: '#1B2A3B',
              border: '1px solid #A8D8F0',
              boxShadow: '0 4px 16px rgba(26,111,196,0.12)',
            },
          }}
        />
      </body>
    </html>
  );
}
