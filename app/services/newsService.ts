// News Service for Ghana TV Stations
// This service handles fetching news from Joy News, TV3, and Adom TV

export interface NewsItem {
  id: string;
  title: string;
  author: string;
  date: string;
  imageSrc: string;
  source: string;
  url?: string;
  summary?: string;
  content?: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: {
      id: string;
      name: string;
    };
    author: string;
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    content: string;
  }>;
}

// Configuration for different news sources
const NEWS_SOURCES = {
  JOY_NEWS: {
    name: "Joy News",
    domain: "myjoyonline.com",
    color: "#E31E24",
    keywords: ["illegal mining", "galamsey", "mining", "environment", "Ghana"],
  },
  TV3: {
    name: "TV3",
    domain: "3news.com",
    color: "#00A0B0", 
    keywords: ["illegal mining", "galamsey", "mining", "environment", "Ghana"],
  },
  ADOM_TV: {
    name: "Adom TV",
    domain: "adomonline.com",
    color: "#FF6B35",
    keywords: ["illegal mining", "galamsey", "mining", "environment", "Ghana"],
  }
};

// NewsAPI.org API key - In production, store this in environment variables
const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || 'your_api_key_here';

// Function to fetch news from NewsAPI for specific domains
async function fetchNewsFromAPI(domains: string[], keywords: string[]): Promise<NewsItem[]> {
  try {
    const domainQuery = domains.join(' OR ');
    const keywordQuery = keywords.join(' OR ');
    
    // Using NewsAPI.org which aggregates news from various sources
    const apiUrl = `https://newsapi.org/v2/everything?` +
      `domains=${domainQuery}&` +
      `q=${encodeURIComponent(keywordQuery)}&` +
      `language=en&` +
      `sortBy=publishedAt&` +
      `pageSize=20&` +
      `apiKey=${NEWS_API_KEY}`;

    console.log('Fetching news from:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'GoldGuard-Ghana/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
    }

    const data: NewsAPIResponse = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(`NewsAPI returned status: ${data.status}`);
    }

    // Transform API response to our NewsItem format
    return data.articles.map((article, index) => ({
      id: `api-${Date.now()}-${index}`,
      title: article.title,
      author: article.author || 'GoldGuard News Team',
      date: new Date(article.publishedAt).toISOString().split('T')[0],
      imageSrc: article.urlToImage || '/assert/ghana-galamsey.jpg',
      source: determineSource(article.source.name, article.url),
      url: article.url,
      summary: article.description || article.content?.substring(0, 150) + '...',
      content: article.content,
    }));

  } catch (error) {
    console.error('Error fetching from NewsAPI:', error);
    return [];
  }
}

// Alternative: Direct RSS/API integration for Ghanaian sources
async function fetchFromGhanaianSources(): Promise<NewsItem[]> {
  const newsItems: NewsItem[] = [];

  try {
    // Joy News - Try direct RSS or API
    const joyNewsItems = await fetchJoyNews();
    newsItems.push(...joyNewsItems);

    // TV3 - Try direct RSS or API  
    const tv3Items = await fetchTV3News();
    newsItems.push(...tv3Items);

    // Adom TV - Try direct RSS or API
    const adomItems = await fetchAdomNews();
    newsItems.push(...adomItems);

  } catch (error) {
    console.error('Error fetching from Ghanaian sources:', error);
  }

  return newsItems;
}

// Individual source fetchers with proper typing
interface RSSNewsItem {
  title: string;
  author?: string;
  publishedAt: string;
  image?: string;
  url: string;
  description: string;
}

async function fetchJoyNews(): Promise<NewsItem[]> {
  try {
    // Joy News RSS or API endpoint
    const response = await fetch('/api/news-proxy?source=joynews', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data: RSSNewsItem[] = await response.json();
      return data.map((item: RSSNewsItem, index: number) => ({
        id: `joy-${Date.now()}-${index}`,
        title: item.title,
        author: item.author || 'Joy News Team',
        date: item.publishedAt || new Date().toISOString().split('T')[0],
        imageSrc: item.image || '/assert/ghana-galamsey.jpg',
        source: 'Joy News',
        url: item.url,
        summary: item.description,
      }));
    }
  } catch (error) {
    console.error('Joy News fetch error:', error);
  }
  return [];
}

async function fetchTV3News(): Promise<NewsItem[]> {
  try {
    // TV3 RSS or API endpoint
    const response = await fetch('/api/news-proxy?source=tv3', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data: RSSNewsItem[] = await response.json();
      return data.map((item: RSSNewsItem, index: number) => ({
        id: `tv3-${Date.now()}-${index}`,
        title: item.title,
        author: item.author || 'TV3 News Team',
        date: item.publishedAt || new Date().toISOString().split('T')[0],
        imageSrc: item.image || '/assert/gatt.png',
        source: 'TV3',
        url: item.url,
        summary: item.description,
      }));
    }
  } catch (error) {
    console.error('TV3 fetch error:', error);
  }
  return [];
}

async function fetchAdomNews(): Promise<NewsItem[]> {
  try {
    // Adom TV RSS or API endpoint
    const response = await fetch('/api/news-proxy?source=adom', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data: RSSNewsItem[] = await response.json();
      return data.map((item: RSSNewsItem, index: number) => ({
        id: `adom-${Date.now()}-${index}`,
        title: item.title,
        author: item.author || 'Adom News Team',
        date: item.publishedAt || new Date().toISOString().split('T')[0],
        imageSrc: item.image || '/assert/image_gh.png',
        source: 'Adom TV',
        url: item.url,
        summary: item.description,
      }));
    }
  } catch (error) {
    console.error('Adom TV fetch error:', error);
  }
  return [];
}

// Helper function to determine source from URL or source name
function determineSource(sourceName: string, url: string): string {
  if (url.includes('myjoyonline.com') || sourceName.toLowerCase().includes('joy')) {
    return 'Joy News';
  }
  if (url.includes('3news.com') || sourceName.toLowerCase().includes('tv3')) {
    return 'TV3';
  }
  if (url.includes('adomonline.com') || sourceName.toLowerCase().includes('adom')) {
    return 'Adom TV';
  }
  return sourceName || 'Ghana News';
}

// Fallback static news for when APIs are unavailable
const fallbackNews: NewsItem[] = [
  {
    id: "fallback-1",
    title: "Ghana Intensifies Fight Against Illegal Mining Operations",
    author: "Emmanuel Kwame",
    date: "2025-08-10",
    imageSrc: "/assert/ghana-galamsey.jpg",
    source: "Joy News",
    summary: "Government launches new operation to combat galamsey activities affecting water bodies and forest reserves.",
  },
  {
    id: "fallback-2",
    title: "Communities Rally Against Environmental Destruction from Mining",
    author: "Akosua Mensah",
    date: "2025-08-09",
    imageSrc: "/assert/gatt.png", 
    source: "TV3",
    summary: "Local communities in mining areas organize protests against illegal mining operations destroying their environment.",
  },
  {
    id: "fallback-3",
    title: "New Mining Technology Promises Environmental Protection",
    author: "Dr. Yaw Osei",
    date: "2025-08-08",
    imageSrc: "/assert/image_gh.png",
    source: "Adom TV",
    summary: "Revolutionary mining technology introduced to minimize environmental impact while maintaining productivity.",
  },
];

// Main export function
export async function fetchLatestNews(): Promise<NewsItem[]> {
  try {
    console.log('Starting news fetch from multiple sources...');

    // Try multiple approaches in parallel
    const [apiNews, directNews] = await Promise.allSettled([
      fetchNewsFromAPI(
        [NEWS_SOURCES.JOY_NEWS.domain, NEWS_SOURCES.TV3.domain, NEWS_SOURCES.ADOM_TV.domain],
        ['illegal mining', 'galamsey', 'Ghana mining', 'environmental protection Ghana']
      ),
      fetchFromGhanaianSources()
    ]);

    const combinedNews: NewsItem[] = [];

    // Combine results from successful fetches
    if (apiNews.status === 'fulfilled' && apiNews.value.length > 0) {
      combinedNews.push(...apiNews.value);
    }

    if (directNews.status === 'fulfilled' && directNews.value.length > 0) {
      combinedNews.push(...directNews.value);
    }

    // If we have news from APIs, return the latest 12 items
    if (combinedNews.length > 0) {
      // Sort by date (newest first) and take top 12
      const sortedNews = combinedNews
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 12);
      
      console.log(`Successfully fetched ${sortedNews.length} news items from APIs`);
      return sortedNews;
    }

    // Fallback to static news if APIs fail
    console.log('APIs unavailable, using fallback news');
    return fallbackNews;

  } catch (error) {
    console.error('Error in fetchLatestNews:', error);
    return fallbackNews;
  }
}
