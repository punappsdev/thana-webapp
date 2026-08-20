import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const securityHeaders = [
  // Enforced headers — safe defaults that never block legit traffic.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // CSP is report-only until we have watched production traffic for a while.
  // It deliberately does not include unsafe-inline for scripts: the app ships
  // no inline <script> in the prod build, so a violation is worth inspecting
  // rather than silently allowing. style-src keeps 'unsafe-inline' because the
  // rich-text editor and shadcn emit inline style attributes. Violations post
  // to /api/csp-report (see app/api/csp-report/route.ts).
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "report-uri /api/csp-report",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  experimental: {
    // 10 MiB file plus multipart field/boundary overhead (Next defaults to 1 MiB).
    serverActions: { bodySizeLimit: "11mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
    '192.168.1.*',
    'localhost:*',
    'thana.ngrok.app'
  ],
};

export default withNextIntl(nextConfig);
