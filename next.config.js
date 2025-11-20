/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Disable x-powered-by header for security
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
