import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://192.168.2.174:8888/:path*',
      },
    ];
  },
};

export default nextConfig;
