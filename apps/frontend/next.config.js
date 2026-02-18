/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/backend-core', '@repo/shared'],
};

module.exports = nextConfig;
