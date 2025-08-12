import { NextRequest, NextResponse } from 'next/server';

interface NewsApiResponse {
  articles: Array<{
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    source: {
      name: string;
    };
    author?: string;
  }>;
}

interface NewsItem {
  id: string;
  title: string;
  author: string;
  date: string;
  imageSrc: string;
  source: string;
  url?: string;
  summary?: string;
}

// Fallback Ghana news data
const getMockGhanaNews = (): NewsItem[] => [
  {
    id: "1",
    title: "Ghana Government Intensifies Anti-Galamsey Operations",
    author: "Ghana Web",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/ghana-galamsey.jpg",
    source: "Ghana Web",
    summary: "Government launches comprehensive operation to combat illegal mining across all regions.",
    url: "https://ghanaweb.com"
  },
  {
    id: "2", 
    title: "Traditional Leaders Unite Against Illegal Mining",
    author: "Citi News",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/gatt.png",
    source: "Citi News",
    summary: "Chiefs across Ghana form alliance to protect community lands from mining activities.",
    url: "https://citinewsroom.com"
  },
  {
    id: "3",
    title: "Environmental Restoration Program Shows Progress",
    author: "Joy News",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/water.png",
    source: "Joy News",
    summary: "Multi-million dollar restoration initiative begins showing positive environmental results.",
    url: "https://myjoyonline.com"
  },
  {
    id: "4",
    title: "Youth Employment in Legal Mining Increases",
    author: "Modern Ghana",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/me.jpg",
    source: "Modern Ghana",
    summary: "Government programs successfully create jobs in legitimate mining sector.",
    url: "https://modernghana.com"
  },
  {
    id: "5",
    title: "New Technology Helps Monitor Mining Activities",
    author: "Graphic Online",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/image_gh.png",
    source: "Graphic Online",
    summary: "Advanced surveillance systems deployed to track illegal mining operations.",
    url: "https://graphic.com.gh"
  },
  {
    id: "6",
    title: "Community Education Programs Expand Nationwide",
    author: "Ghana Business",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/land.png",
    source: "Ghana Business",
    summary: "Educational initiatives help communities understand environmental protection.",
    url: "#"
  }
];

export async function GET(request: NextRequest) {
  try {
    const newsApiKey = process.env.NEWS_API_KEY;
    
    // If no API key is available, return mock data
    if (!newsApiKey) {
      console.log('No NewsAPI key found, returning mock Ghana news data');
      return NextResponse.json({
        success: true,
        articles: getMockGhanaNews(),
        source: 'mock',
        message: 'Using mock Ghana news data (no API key configured)'
      });
    }

    // Fetch from NewsAPI
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=Ghana+mining+environment+galamsey&language=en&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey}`,
      {
        headers: {
          'User-Agent': 'GoldGuard/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
    }

    const data: NewsApiResponse = await response.json();
    
    // Transform API data to our format
    const newsItems: NewsItem[] = data.articles
      .filter(article => article.title && article.description)
      .slice(0, 6)
      .map((article, index) => ({
        id: `api_${Date.now()}_${index}`,
        title: article.title,
        author: article.author || article.source.name,
        date: new Date(article.publishedAt).toISOString().split('T')[0],
        imageSrc: article.urlToImage || "/assert/ghana-galamsey.jpg",
        source: article.source.name,
        summary: article.description,
        url: article.url
      }));

    // If no Ghana-specific news found, return mock data
    if (newsItems.length === 0) {
      return NextResponse.json({
        success: true,
        articles: getMockGhanaNews(),
        source: 'mock',
        message: 'No Ghana news found via API, using mock data'
      });
    }

    return NextResponse.json({
      success: true,
      articles: newsItems,
      source: 'api',
      message: `Fetched ${newsItems.length} articles from NewsAPI`
    });

  } catch (error) {
    console.error('Error fetching Ghana news:', error);
    
    // Return mock data on error
    return NextResponse.json({
      success: true,
      articles: getMockGhanaNews(),
      source: 'mock',
      message: 'API error, using mock Ghana news data'
    });
  }
}
