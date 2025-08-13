import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "jq-web", // Fix for build error: "ENOENT: no such file or directory, open ....next/server/chunks/jq.wasm"
    "@stellar/stellar-sdk", // sodium-native lib isn't compatible with webpack bundling
  ],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
