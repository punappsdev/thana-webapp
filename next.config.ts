import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.51', '90f1-2001-fb1-1c-853a-a9b6-df89-2f67-854c.ngrok-free.app'],
};

export default withNextIntl(nextConfig);
