import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../"),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
      {
        source: "/uploads/events/:path*",
        destination: "http://localhost:5000/uploads/events/:path*",
      },
    ];
  },
} as NextConfig;

export default nextConfig;
