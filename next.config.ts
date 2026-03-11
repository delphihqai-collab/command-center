import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    // Type checking handled by `tsc --noEmit` in CI.
    // The Next.js TS plugin conflicts with Supabase generic resolution.
    ignoreBuildErrors: true,
  },
  // Explicitly define NEXT_PUBLIC_* env vars for Turbopack production builds.
  // Turbopack sometimes fails to inline these from .env.local during build.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
