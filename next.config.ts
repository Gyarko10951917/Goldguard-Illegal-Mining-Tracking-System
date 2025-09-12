import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'ghanaiantimes.com.gh',
      'newsdata.io',
      'img.newsdata.io',
      'www.ghanaweb.com',
      'citinewsroom.com',
      'www.myjoyonline.com',
      'www.graphic.com.gh',
      'modernghana.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.newsdata.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ghanaiantimes.com.gh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.ghanaweb.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'citinewsroom.com',
        port: '',
        pathname: '/**',
      }
    ]
  }
};

export default nextConfig;
