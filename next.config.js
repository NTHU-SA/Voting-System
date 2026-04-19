/** @type {import('next').NextConfig} */

module.exports = {
  // Rewrite /callback to /api/auth/callback
  async rewrites() {
    return [
      {
        source: "/callback",
        destination: "/api/auth/callback",
      },
    ];
  },
  reactStrictMode: true,
  output: "standalone",
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "img-src 'self' data: blob: https:",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
  // Disable x-powered-by header for security
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};
