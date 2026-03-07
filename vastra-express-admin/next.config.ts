import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tells webpack to only bundle the specific icons/components used from these
    // packages instead of the entire library — reduces per-route bundle sizes
    // and speeds up on-demand compilation in dev mode.
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
};

export default nextConfig;
