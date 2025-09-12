import { NextRequest, NextResponse } from 'next/server';

interface NewsDataIOArticle {
  title: string;
  description: string;
  content: string;
  link: string;
  image_url: string;
  pubDate: string;
  source_id: string;
  creator: string[] | string;
}

interface NewsDataIOResponse {
  results: NewsDataIOArticle[];
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

export async function GET(_request: NextRequest) {
  try {
    // Use newsdata.io API for Ghana mining/environment news
    const response = await fetch(
      'https://newsdata.io/api/1/latest?apikey=pub_f2871dcf43ea48bda83c771b5eee40db&q=illegal%20mining&country=gh&language=en&category=environment&timezone=Africa/Cairo',
      {
        headers: {
          'User-Agent': 'GoldGuard/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`newsdata.io error: ${response.status} ${response.statusText}`);
    }

    const apiData: NewsDataIOResponse = await response.json();
    
    // newsdata.io returns results in apiData.results
    const newsItems: NewsItem[] = (apiData.results || []).map((article: NewsDataIOArticle, idx: number) => ({
      id: `${idx + 1}`,
      title: article.title,
      author: article.creator ? (Array.isArray(article.creator) ? article.creator.join(', ') : article.creator) : (article.source_id || 'Unknown'),
      date: article.pubDate ? article.pubDate.split(' ')[0] : new Date().toISOString().split('T')[0],
      imageSrc: article.image_url || '/assert/ghana-galamsey.jpg',
      source: article.source_id || 'newsdata.io',
      summary: article.description || article.content || '',
      url: article.link
    }));

    return NextResponse.json({
      success: true,
      articles: newsItems,
      source: 'newsdata.io',
      message: `Fetched ${newsItems.length} articles from newsdata.io`
    });
  } catch (error) {
    console.error('Error fetching Ghana news from newsdata.io:', error);
    
    // Fallback to mock data if API fails
    console.log('Falling back to mock Ghana news data');
    return NextResponse.json({
      success: true,
      articles: getMockGhanaNews(),
      source: 'mock',
      message: 'Using mock Ghana news data (API failed)'
    });
  }
}
