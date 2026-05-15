/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
