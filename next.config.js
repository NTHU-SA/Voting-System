/** @type {import('next').NextConfig} */

module.exports = {
  // Allow local development origins for cross-origin dev requests (override with ALLOWED_DEV_ORIGINS).
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((origin) => origin.trim())
    : ["http://localhost:3000", "http://127.0.0.1:3000"],
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
