import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vastra Express',
    short_name: 'VastraExpress',
    description: 'Premium Laundry at Your Doorstep. Book pickup online: Wash, Iron, Dry Clean.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7FBFF',
    theme_color: '#1A6FC4',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
