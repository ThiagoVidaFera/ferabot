import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  output: "standalone",
  experimental: {
    // foto e áudio passam fácil do limite padrão de 1MB das server actions
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
