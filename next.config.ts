import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  experimental: {
    // 10 MiB file plus multipart field/boundary overhead (Next defaults to 1 MiB).
    serverActions: { bodySizeLimit: "11mb" },
  },
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
    '192.168.1.*',
    'localhost:*'
  ],
};

export default withNextIntl(nextConfig);
