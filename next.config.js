/** @type {import('next').NextConfig} */
const SourceTaggingPlugin = require('@antonmagnus/next-source-tagging');

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' }
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Only apply source tagging in development mode
    if (dev) {
      // Add the loader explicitly to ensure it's applied
      // const loaderPath = path.resolve(__dirname, '../dist/loader.js');
      const loaderPath = require.resolve('@antonmagnus/next-source-tagging/dist/loader.js');
      config.module.rules.unshift({
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: [{
          loader: loaderPath,
          options: {
            debug: false,
            enabled: true,
            enableInProduction: false
          }
        }]
      });
    }

    return config;
  },
}

module.exports = nextConfig