import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@cardvault/api', '@cardvault/core', '@cardvault/validation'],
};

export default nextConfig;
