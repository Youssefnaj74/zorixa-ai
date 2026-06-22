import { getSecurityHeaders } from "./lib/security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders()
      }
    ];
  },
  async redirects() {
    return [
      { source: "/support@zorixaai.com", destination: "/support", permanent: true },
      { source: "/billing@zorixaai.com", destination: "/billing", permanent: true },
      { source: "/hello@zorixaai.com", destination: "/contact", permanent: true },
      { source: "/privacy@zorixaai.com", destination: "/contact", permanent: true },
      { source: "/abuse@zorixaai.com", destination: "/abuse", permanent: true },
      { source: "/:path+/support@zorixaai.com", destination: "/support", permanent: true },
      { source: "/:path+/billing@zorixaai.com", destination: "/billing", permanent: true },
      { source: "/:path+/abuse@zorixaai.com", destination: "/abuse", permanent: true }
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "atlas-media.oss-us-west-1.aliyuncs.com",
        pathname: "/**"
      },
      { protocol: "https", hostname: "**.aliyuncs.com", pathname: "/**" },
      { protocol: "https", hostname: "**.supabase.co", pathname: "/**" }
    ]
  }
};

export default nextConfig;
