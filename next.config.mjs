import { getSecurityHeaders } from "./lib/security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Video reference uploads (Gemini / Seedance / Wan) routinely exceed Next's 10MB default.
  experimental: {
    proxyClientMaxBodySize: "100mb",
    serverActions: {
      bodySizeLimit: "100mb"
    }
  },
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
      {
        source: "/:path*",
        has: [{ type: "host", value: "zorixaai.com" }],
        destination: "https://www.zorixaai.com/:path*",
        permanent: true
      },
      { source: "/support@zorixaai.com", destination: "/support", permanent: true },
      { source: "/billing@zorixaai.com", destination: "/billing", permanent: true },
      { source: "/hello@zorixaai.com", destination: "/contact", permanent: true },
      { source: "/privacy@zorixaai.com", destination: "/contact", permanent: true },
      { source: "/abuse@zorixaai.com", destination: "/abuse", permanent: true },
      { source: "/:path+/support@zorixaai.com", destination: "/support", permanent: true },
      { source: "/:path+/billing@zorixaai.com", destination: "/billing", permanent: true },
      { source: "/:path+/abuse@zorixaai.com", destination: "/abuse", permanent: true },
      // Legacy Settings link; Usage lives under Billing
      { source: "/dashboard/usage", destination: "/dashboard/billing", permanent: true }
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
