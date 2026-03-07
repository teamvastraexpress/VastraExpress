import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vastra Express — Premium Laundry at Your Doorstep',
  description:
    'Book laundry pickup online. Wash, Iron, Dry Clean — delivered back fresh. Transparent pricing, on-time service.',
  keywords: 'laundry service, laundry pickup, wash and fold, dry clean, iron service',
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
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-white text-gray-900`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '8px', fontSize: '14px' },
          }}
        />
      </body>
    </html>
  );
}
