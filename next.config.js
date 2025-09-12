/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ghanaiantimes.com.gh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'newsghana.com.gh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.newsghana.com.gh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'b843437.smushcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'newsdata.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.newsdata.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'n.bytvi.com',
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
      },
      {
        protocol: 'https',
        hostname: 'www.myjoyonline.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.graphic.com.gh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'modernghana.com',
        port: '',
        pathname: '/**',
      }
    ]
  }
};

module.exports = nextConfig;
