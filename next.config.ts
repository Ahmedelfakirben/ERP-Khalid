import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/pos/ventes",
        destination: "/historique-pos",
        permanent: true,
      },
      {
        source: "/pos/ventes/:id",
        destination: "/historique-pos/:id",
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
