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
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }
    ]
  }
};

export default nextConfig;
