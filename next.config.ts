import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    // Type checking handled by `tsc --noEmit` in CI.
    // The Next.js TS plugin conflicts with Supabase generic resolution.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
