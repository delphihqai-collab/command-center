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
  async headers() {
    return [
      {
        // Prevent browsers from caching redirects
        source: "/:path(war-room|command|dashboard|operations|office|sessions|costs|cron|logs|memory|webhooks|alerts|audit-log|gateway|integrations|settings|templates)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // V10 redirects: old pages → new locations (temporary to avoid browser cache loops)
      { source: "/war-room", destination: "/", permanent: false },
      { source: "/command", destination: "/", permanent: false },
      { source: "/dashboard", destination: "/", permanent: false },
      { source: "/operations", destination: "/", permanent: false },
      { source: "/office", destination: "/fleet", permanent: false },
      { source: "/agents/:slug*", destination: "/fleet/:slug*", permanent: false },
      { source: "/sessions", destination: "/fleet", permanent: false },
      { source: "/costs", destination: "/fleet", permanent: false },
      { source: "/cron", destination: "/system", permanent: false },
      { source: "/logs", destination: "/system", permanent: false },
      { source: "/memory", destination: "/system", permanent: false },
      { source: "/webhooks", destination: "/system", permanent: false },
      { source: "/alerts", destination: "/system", permanent: false },
      { source: "/audit-log", destination: "/system", permanent: false },
      { source: "/gateway", destination: "/system", permanent: false },
      { source: "/integrations", destination: "/system", permanent: false },
      { source: "/settings", destination: "/system", permanent: false },
      { source: "/templates", destination: "/pipeline", permanent: false },
    ];
  },
};

export default nextConfig;
