import type { NextConfig } from 'next';

// The old multi-page URLs stay alive and land on their section of the one-page site.
const legacySections: Record<string, string> = {
  '/works': 'works',
  '/construction': 'construction-3d',
  '/about': 'about',
  '/contacts': 'contacts',
};

const nextConfig: NextConfig = {
  images: {
    // AVIF keeps the timber grain close to the designer's own encodes while
    // staying smaller than the shipped webp files.
    formats: ['image/avif', 'image/webp'],
    // Photos are versioned in their file names by the designer (v19, v27 …), so
    // an optimised copy can live in the CDN cache for a week.
    minimumCacheTTL: 604800,
  },
  async headers() {
    return [
      {
        // Photos are versioned in their file names by the designer (v19, v27 …).
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  async redirects() {
    return Object.entries(legacySections).flatMap(([from, anchor]) => [
      { source: from, destination: `/#${anchor}`, permanent: true },
      { source: `${from}.html`, destination: `/#${anchor}`, permanent: true },
    ]);
  },
};

export default nextConfig;
