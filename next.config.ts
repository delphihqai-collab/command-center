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
  async redirects() {
    return [
      // V10 redirects: old pages → new locations
      { source: "/war-room", destination: "/", permanent: true },
      { source: "/command", destination: "/", permanent: true },
      { source: "/dashboard", destination: "/", permanent: true },
      { source: "/operations", destination: "/", permanent: true },
      { source: "/office", destination: "/fleet", permanent: true },
      { source: "/agents/:slug*", destination: "/fleet/:slug*", permanent: true },
      { source: "/sessions", destination: "/fleet", permanent: true },
      { source: "/costs", destination: "/fleet", permanent: true },
      { source: "/cron", destination: "/system", permanent: true },
      { source: "/logs", destination: "/system", permanent: true },
      { source: "/memory", destination: "/system", permanent: true },
      { source: "/webhooks", destination: "/system", permanent: true },
      { source: "/alerts", destination: "/system", permanent: true },
      { source: "/audit-log", destination: "/system", permanent: true },
      { source: "/gateway", destination: "/system", permanent: true },
      { source: "/integrations", destination: "/system", permanent: true },
      { source: "/settings", destination: "/system", permanent: true },
      { source: "/templates", destination: "/pipeline", permanent: true },
    ];
  },
};

export default nextConfig;
