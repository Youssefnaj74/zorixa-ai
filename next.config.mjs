import path from "node:path";
import { fileURLToPath } from "node:url";

/** Resolve project root to this folder (zorixa-ai), not a parent `Documents` lockfile. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      root: projectRoot,
    }
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      /** Atlas Cloud image outputs (OSS). */
      {
        protocol: "https",
        hostname: "atlas-media.oss-us-west-1.aliyuncs.com",
        pathname: "/**"
      },
      { protocol: "https", hostname: "**.aliyuncs.com", pathname: "/**" },
      /** Supabase Storage public URLs (reference uploads in history). */
      { protocol: "https", hostname: "**.supabase.co", pathname: "/**" }
    ]
  }
};

export default nextConfig;
