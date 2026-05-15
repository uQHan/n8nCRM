import type { NextConfig } from "next";

const springBackendInternalUrl = (
  process.env.SPRING_BACKEND_INTERNAL_URL || "http://spring-backend:8080"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      // Proxy API calls to Spring Boot. This avoids needing a public backend URL in NEXT_PUBLIC_* env vars.
      {
        source: "/api/:path*",
        destination: `${springBackendInternalUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },
};

export default nextConfig;
