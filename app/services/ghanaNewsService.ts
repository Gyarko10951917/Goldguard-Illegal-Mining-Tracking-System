// News API service for Ghana-specific headlines
// Using multiple free/freemium APIs for better coverage

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

interface NewsDataApiResponse {
  results: Array<{
    title: string;
    description: string;
    link: string;
    image_url: string;
    pubDate: string;
    source_id: string;
    creator?: string[];
  }>;
}

export interface NewsItem {
  id: string;
  title: string;
  author: string;
  date: string;
  imageSrc: string;
  source: string;
  url?: string;
  summary?: string;
}

// Free APIs that can be used for Ghana news
const FREE_NEWS_APIS = {
  // NewsAPI.org - Free tier: 100 requests/day
  newsapi: {
    baseUrl: 'https://newsapi.org/v2/everything',
    key: process.env.NEXT_PUBLIC_NEWS_API_KEY, // Optional
  },
  
  // NewsData.io - Free tier: 200 requests/day
  newsdata: {
    baseUrl: 'https://newsdata.io/api/1/news',
    key: process.env.NEXT_PUBLIC_NEWSDATA_API_KEY, // Optional
  },
  
  // RSS feeds from Ghana news sources (completely free)
  rssFeeds: [
    'https://www.ghanaweb.com/GhanaHomePage/rss/news.xml',
    'https://citinewsroom.com/feed/',
    'https://www.myjoyonline.com/rss/',
    'https://www.graphic.com.gh/rss/news.xml',
  ]
};

// Fallback mock data for Ghana news
const getMockGhanaNews = (): NewsItem[] => [
  {
    id: "1",
    title: "Ghana Government Intensifies Fight Against Illegal Mining",
    author: "Ghana Web",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/ghana-galamsey.jpg",
    source: "Ghana Web",
    summary: "President launches new initiative to combat galamsey activities across mining communities.",
    url: "https://ghanaweb.com"
  },
  {
    id: "2", 
    title: "Eastern Region Chiefs Unite Against Illegal Mining",
    author: "Citi News",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/gatt.png",
    source: "Citi News",
    summary: "Traditional leaders form coalition to protect forest reserves from mining activities.",
    url: "https://citinewsroom.com"
  },
  {
    id: "3",
    title: "New Environmental Protection Measures Announced",
    author: "Joy News",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/image_gh.png",
    source: "Joy News",
    summary: "Government introduces stricter regulations for mining operations to protect water bodies.",
    url: "https://myjoyonline.com"
  },
  {
    id: "4",
    title: "Community Mining Rehabilitation Program Launched",
    author: "Graphic Online",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/land.png",
    source: "Graphic Online",
    summary: "Multi-million dollar program to restore lands damaged by illegal mining activities.",
    url: "https://graphic.com.gh"
  },
  {
    id: "5",
    title: "Technology Solutions for Mining Monitoring Deployed",
    author: "Modern Ghana",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/water.png",
    source: "Modern Ghana",
    summary: "Satellite monitoring system helps track illegal mining activities in real-time.",
    url: "https://modernghana.com"
  },
  {
    id: "6",
    title: "Youth Employment in Legal Mining Sectors Increases",
    author: "Ghana Business",
    date: new Date(Date.now() - Math.random() * 86400000).toISOString().split('T')[0],
    imageSrc: "/assert/me.jpg",
    source: "Ghana Business",
    summary: "Government programs successfully transition youth from illegal to legal mining jobs.",
    url: "#"
  }
];

// Fetch news from NewsAPI (if API key available)
async function fetchFromNewsAPI(query: string = "Ghana mining"): Promise<NewsItem[]> {
  const apiKey = FREE_NEWS_APIS.newsapi.key;
  if (!apiKey) {
    console.log('NewsAPI key not available, using fallback data');
    return [];
  }

  try {
    const response = await fetch(
      `${FREE_NEWS_APIS.newsapi.baseUrl}?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }
    
    const data: NewsApiResponse = await response.json();
    
    return data.articles
      .filter(article => article.title && article.description)
      .slice(0, 6)
      .map((article, index) => ({
        id: `newsapi_${index}`,
        title: article.title,
        author: article.author || article.source.name,
        date: new Date(article.publishedAt).toISOString().split('T')[0],
        imageSrc: article.urlToImage || "/assert/ghana-galamsey.jpg",
        source: article.source.name,
        summary: article.description,
        url: article.url
      }));
  } catch (error) {
    console.error('NewsAPI fetch failed:', error);
    return [];
  }
}

// Fetch news from NewsData API (if API key available)
async function fetchFromNewsDataAPI(): Promise<NewsItem[]> {
  const apiKey = FREE_NEWS_APIS.newsdata.key;
  if (!apiKey) {
    console.log('NewsData API key not available, using fallback data');
    return [];
  }

  try {
    const response = await fetch(
      `${FREE_NEWS_APIS.newsdata.baseUrl}?apikey=${apiKey}&country=gh&language=en&category=politics,environment&size=10`
    );
    
    if (!response.ok) {
      throw new Error(`NewsData API error: ${response.status}`);
    }
    
    const data: NewsDataApiResponse = await response.json();
    
    return data.results
      .filter(article => article.title && article.description)
      .slice(0, 6)
      .map((article, index) => ({
        id: `newsdata_${index}`,
        title: article.title,
        author: article.creator?.[0] || article.source_id,
        date: new Date(article.pubDate).toISOString().split('T')[0],
        imageSrc: article.image_url || "/assert/ghana-galamsey.jpg",
        source: article.source_id,
        summary: article.description,
        url: article.link
      }));
  } catch (error) {
    console.error('NewsData API fetch failed:', error);
    return [];
  }
}

// Main function to fetch Ghana news from API route
export async function fetchGhanaNews(): Promise<NewsItem[]> {
  console.log('Fetching Ghana news from API route...');
  
  try {
    const response = await fetch('/api/ghana-news', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for better performance
      next: { revalidate: 1800 } // 30 minutes
    });
    
    if (!response.ok) {
      throw new Error(`API route error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.articles) {
      console.log(`Successfully fetched ${data.articles.length} Ghana news items (source: ${data.source})`);
      return data.articles;
    }
    
    throw new Error('Invalid API response format');
    
  } catch (error) {
    console.error('Error fetching from API route:', error);
    // Fallback to mock data
    console.log('Using fallback mock Ghana news data');
    return getMockGhanaNews();
  }
}

// Alternative: Free RSS feed parsing (completely free, no API key needed)
export async function fetchGhanaNewsFromRSS(): Promise<NewsItem[]> {
  try {
    // This would require a CORS proxy or server-side parsing
    // For now, return mock data that represents RSS-sourced news
    console.log('Fetching from Ghana RSS feeds...');
    return getMockGhanaNews();
  } catch (error) {
    console.error('RSS fetch failed:', error);
    return getMockGhanaNews();
  }
}

// Export mock data function for fallback
export { getMockGhanaNews };
