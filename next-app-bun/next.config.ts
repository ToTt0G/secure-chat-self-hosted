import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/socket.io/:path*",
        destination: (process.env.INTERNAL_SOCKET_URL || "http://socket-server:3001") + "/socket.io/:path*",
      },
    ];
  },
};

export default nextConfig;
