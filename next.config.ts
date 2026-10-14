import type { NextConfig } from "next";

const cloudflare = process.env.CAMPUS_CLOUDFLARE === "1";
const config: NextConfig = {
  ...(cloudflare ? { output: "standalone" } : {}),
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // Photos use responsive, pre-optimized CDN formats.
  images: { unoptimized: cloudflare },
};

export default config;
