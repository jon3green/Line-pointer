const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
    ],
  },
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
};

const sentryWebpackPluginOptions = {
  org: "linepointer",
  project: "linepointer-nextjs",
  silent: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)

