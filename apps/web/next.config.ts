import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@cardvault/api', '@cardvault/core', '@cardvault/validation'],
  output: 'standalone',
  // Needed so standalone traces files from the monorepo root, not just apps/web
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
