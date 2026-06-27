/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        'utf-8-validate': false,
        'bufferutil': false,
        '@react-native-async-storage/async-storage': false,
        encoding: false,
        'pino-pretty': false,
      };
    }
    
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    
    config.ignoreWarnings = [
      {
        module: /node_modules\/@metamask\/sdk/,
        message: /Module not found/,
      },
      {
        module: /node_modules\/node-fetch/,
        message: /Module not found/,
      },
      {
        module: /node_modules\/@walletconnect/,
        message: /Module not found/,
      },
      {
        module: /node_modules\/viem\/node_modules\/ox/,
        message: /Critical dependency/,
      },
    ];
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
