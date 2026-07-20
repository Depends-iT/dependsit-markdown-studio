import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disable browser source maps in production — Turbopack emits indexed
  // source maps (with `sections` instead of `mappings`) that Lighthouse and
  // some Chrome devtools versions can't parse, producing "Map has no mappings
  // field" errors. Source maps are still generated for the dev experience.
  productionBrowserSourceMaps: false,
  // Remove the `X-Powered-By: Next.js` header — minor security/SEO hygiene.
  poweredByHeader: false,
  // Enable Brotli + gzip compression for all static responses.
  compress: true,
  // Pin an explicit page extension list to avoid accidental route creation
  // from test/story files.
  pageExtensions: ["ts", "tsx", "js", "jsx"],
  // Force trailing-slash-free URLs for canonical consistency.
  trailingSlash: false,
  experimental: {
    // Optimize React server rendering with the React Compiler.
    optimizePackageImports: [
      "lucide-react",
      "@uiw/react-md-editor",
      "react-markdown",
    ],
  },
};

export default nextConfig;
