import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['next-app', 'localhost', '127.0.0.1']
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
