/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Add timeout and loading optimizations for external images
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    // Increase timeout for slow-loading images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
      },
      {
        protocol: 'https',
        hostname: 'sm.ign.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.wp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.medium.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.ghanamma.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ghanamma.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pulse.com.gh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pulse.com.gh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.citifmonline.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'citifmonline.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.peacefmonline.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'peacefmonline.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.adomonline.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'adomonline.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '3news.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.3news.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'myjoyonline.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.newsghana.com.gh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ghanaweb.com',
        port: '',
        pathname: '/**',
      },
      // Wildcard patterns for common Ghana news domains
      {
        protocol: 'https',
        hostname: '*.com.gh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.gh',
        port: '',
        pathname: '/**',
      },
      // General image hosting services
      {
        protocol: 'https',
        hostname: '*.wp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.wordpress.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
        port: '',
        pathname: '/**',
      }
    ]
  }
};

module.exports = nextConfig;
