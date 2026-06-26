import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import PwaRegister from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: 'Vastra Express — Driver Portal',
  description: 'Driver operational dashboard for Vastra Express laundry platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vastra Driver',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A6FC4',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        <PwaRegister />
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
