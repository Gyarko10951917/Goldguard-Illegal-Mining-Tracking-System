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

// Cache constants
const CACHE_KEY = 'goldguard_ghana_news_cache';
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

interface NewsCacheData {
  articles: NewsItem[];
  timestamp: number;
  lastUpdateCheck: number;
  apiHash?: string; // To detect API changes
}

// Save news to localStorage with timestamp
const saveNewsToCache = (articles: NewsItem[], apiHash?: string): void => {
  const cacheData: NewsCacheData = {
    articles,
    timestamp: Date.now(),
    lastUpdateCheck: Date.now(),
    apiHash
  };
  
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`📱 Cached ${articles.length} news items at ${new Date().toLocaleString()}`);
    }
  } catch (error) {
    console.error('Failed to save news to cache:', error);
  }
};

// Get cached news from localStorage
const getCachedNews = (): NewsCacheData | null => {
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached) as NewsCacheData;
        console.log(`📱 Found ${data.articles.length} cached articles from ${new Date(data.timestamp).toLocaleString()}`);
        return data;
      }
    }
  } catch (error) {
    console.error('Failed to retrieve cached news:', error);
  }
  return null;
};

// Check if we should try to fetch new data
const shouldCheckForUpdates = (cacheData: NewsCacheData): boolean => {
  const now = Date.now();
  const timeSinceLastCheck = now - cacheData.lastUpdateCheck;
  return timeSinceLastCheck >= REFRESH_INTERVAL;
};

// Merge new articles with existing cache, avoiding duplicates
const mergeWithCache = (newArticles: NewsItem[], cachedData: NewsCacheData): NewsItem[] => {
  if (!newArticles.length) {
    console.log('📰 No new articles from API, maintaining existing cache');
    return cachedData.articles;
  }

  // Create a map of existing articles by a combination of title and date for better duplicate detection
  const existingArticles = new Map();
  cachedData.articles.forEach(article => {
    const key = `${article.title.toLowerCase().trim()}_${article.date}`;
    existingArticles.set(key, article);
  });

  // Filter out duplicates from new articles
  const uniqueNewArticles = newArticles.filter(article => {
    const key = `${article.title.toLowerCase().trim()}_${article.date}`;
    return !existingArticles.has(key);
  });
  
  if (uniqueNewArticles.length > 0) {
    console.log(`📰 Found ${uniqueNewArticles.length} new unique articles, merging with ${cachedData.articles.length} existing`);
    // Sort by date (newest first) and keep latest 15 articles total
    const allArticles = [...uniqueNewArticles, ...cachedData.articles];
    const sortedArticles = allArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sortedArticles.slice(0, 15);
  } else {
    console.log('📰 No new unique articles found, keeping existing cache');
    return cachedData.articles;
  }
};

// Generate a simple hash of API response to detect changes
const generateApiHash = (articles: NewsItem[]): string => {
  const titlesAndDates = articles.map(a => `${a.title}_${a.date}`).join('|');
  
  // Use a simple hash function that can handle Unicode characters
  let hash = 0;
  for (let i = 0; i < titlesAndDates.length; i++) {
    const char = titlesAndDates.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16).substring(0, 10);
};

export async function fetchGhanaNews(): Promise<NewsItem[]> {
  console.log('🔄 Fetching Ghana news with persistent caching...');
  
  // Always try to get cached data first
  const cachedData = getCachedNews();
  
  // If we have cached data and it's recent, check if we need to fetch new data
  if (cachedData && !shouldCheckForUpdates(cachedData)) {
    console.log('📱 Using cached news - not time to check for updates yet');
    return cachedData.articles;
  }
  
  try {
    // Try to fetch new data from API
    const response = await fetch('/api/ghana-news', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      next: { revalidate: 0 } // Disable Next.js caching for fresh data
    });
    
    if (!response.ok) {
      throw new Error(`API route error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the response has the expected structure
    if (data && typeof data === 'object' && 'articles' in data) {
      if (data.success && Array.isArray(data.articles)) {
        console.log(`✅ Successfully fetched ${data.articles.length} Ghana news items from API`);
        
        const apiHash = generateApiHash(data.articles);
        
        if (cachedData) {
          // Check if API data has actually changed
          if (cachedData.apiHash === apiHash && data.articles.length === cachedData.articles.length) {
            console.log('📰 API data unchanged, updating cache timestamp only');
            // Update only the timestamp to prevent frequent API calls
            cachedData.lastUpdateCheck = Date.now();
            saveNewsToCache(cachedData.articles, apiHash);
            return cachedData.articles;
          } else {
            // API has new/changed data, merge with cache
            console.log('📰 API data changed, merging with cache');
            const mergedArticles = mergeWithCache(data.articles, cachedData);
            saveNewsToCache(mergedArticles, apiHash);
            return mergedArticles;
          }
        } else {
          // No cache exists, save new articles
          console.log('📰 No cache found, saving new articles');
          saveNewsToCache(data.articles, apiHash);
          return data.articles;
        }
      } else {
        // API returned success: false, but check if we have cached data
        console.warn('⚠️ API returned success: false, message:', data.message);
        if (cachedData && cachedData.articles.length > 0) {
          console.log('📱 API failed, returning cached articles');
          return cachedData.articles;
        }
        return [];
      }
    }
    
    throw new Error('Invalid API response format: missing articles property');
    
  } catch (error) {
    console.error('❌ Error fetching from API route:', error);
    
    // If API fails, return cached data if available
    if (cachedData && cachedData.articles.length > 0) {
      console.log(`📱 API failed, returning ${cachedData.articles.length} cached articles`);
      return cachedData.articles;
    }
    
    // No cache available and API failed
    console.log('📱 No cached data available, returning empty news array');
    return [];
  }
}

// Force refresh - ignores cache and fetches fresh data
export async function forceRefreshNews(): Promise<NewsItem[]> {
  console.log('🔄 Force refreshing Ghana news...');
  
  try {
    const response = await fetch('/api/ghana-news', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`API route error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.success && Array.isArray(data.articles)) {
      console.log(`✅ Force refresh got ${data.articles.length} articles`);
      const apiHash = generateApiHash(data.articles);
      
      // Get existing cache to merge
      const cachedData = getCachedNews();
      if (cachedData) {
        const mergedArticles = mergeWithCache(data.articles, cachedData);
        saveNewsToCache(mergedArticles, apiHash);
        return mergedArticles;
      } else {
        saveNewsToCache(data.articles, apiHash);
        return data.articles;
      }
    } else {
      throw new Error('Invalid API response on force refresh');
    }
  } catch (error) {
    console.error('❌ Force refresh failed:', error);
    // Fallback to cached data
    const cachedData = getCachedNews();
    return cachedData ? cachedData.articles : [];
  }
}

// Get cache information for debugging
export const getCacheInfo = (): { 
  hasCache: boolean; 
  articleCount: number; 
  lastUpdate: string;
  nextCheckDue: string;
  cacheAge: string;
} => {
  const cachedData = getCachedNews();
  
  if (cachedData) {
    const now = Date.now();
    const cacheAge = Math.floor((now - cachedData.timestamp) / (1000 * 60)); // minutes
    const nextCheck = new Date(cachedData.lastUpdateCheck + REFRESH_INTERVAL);
    
    return {
      hasCache: true,
      articleCount: cachedData.articles.length,
      lastUpdate: new Date(cachedData.timestamp).toLocaleString(),
      nextCheckDue: nextCheck.toLocaleString(),
      cacheAge: `${cacheAge} minutes ago`
    };
  }
  
  return {
    hasCache: false,
    articleCount: 0,
    lastUpdate: 'Never',
    nextCheckDue: 'Now',
    cacheAge: 'No cache'
  };
};
