import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["../shared"],
  images: { remotePatterns: [{ protocol: "http", hostname: "localhost", port: "9500" }] },
  experimental: { serverActions: { bodySizeLimit: "50mb" } },
  async headers() {
    return [
      { source: "/(.*)", headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
      ]},
    ];
  },
};
export default nextConfig;
