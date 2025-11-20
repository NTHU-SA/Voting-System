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
  // Disable x-powered-by header for security
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};
