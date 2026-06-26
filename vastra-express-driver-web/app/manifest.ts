import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vastra Express Driver',
    short_name: 'VastraDriver',
    description: 'Driver operational dashboard for Vastra Express laundry platform',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    background_color: '#F9FAFB',
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
