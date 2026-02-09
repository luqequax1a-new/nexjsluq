import type { NextConfig } from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  transpilePackages: ["antd", "@ant-design/icons"],
  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: "/api/sitemap" },
      { source: "/sitemap-products-:page.xml", destination: "/api/sitemap/products/:page" },
      { source: "/sitemap-categories.xml", destination: "/api/sitemap/categories" },
      { source: "/sitemap-brands.xml", destination: "/api/sitemap/brands" },
      { source: "/sitemap-pages.xml", destination: "/api/sitemap/pages" },
      { source: "/sitemap-static.xml", destination: "/api/sitemap/static" },
      { source: "/robots.txt", destination: "/api/robots" },
    ];
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
};

// Force rebuild
export default nextConfig;
