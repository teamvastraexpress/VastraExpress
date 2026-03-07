import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake large icon/chart libs so only used exports are bundled.
    // This significantly reduces per-route bundle sizes and speeds up
    // on-demand compilation in development mode.
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default nextConfig;
