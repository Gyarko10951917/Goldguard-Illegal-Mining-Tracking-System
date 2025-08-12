// API proxy to fetch news from Ghanaian sources
// This handles CORS and provides a unified interface for news fetching

import { NextRequest, NextResponse } from 'next/server';

interface NewsItem {
  title: string;
  author?: string;
  publishedAt: string;
  image?: string;
  url: string;
  description: string;
}

// RSS feed URLs for Ghanaian news sources
const NEWS_SOURCES = {
  joynews: {
    rss: 'https://www.myjoyonline.com/feed/',
    name: 'Joy News',
    baseUrl: 'https://www.myjoyonline.com'
  },
  tv3: {
    rss: 'https://3news.com/feed/',
    name: 'TV3',
    baseUrl: 'https://3news.com'
  },
  adom: {
    rss: 'https://adomonline.com/feed/',
    name: 'Adom TV',
    baseUrl: 'https://adomonline.com'
  }
};

// Function to parse RSS XML to JSON
async function parseRSSFeed(rssUrl: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'GoldGuard-Ghana/1.0 (News Aggregator)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Parse XML manually (you could use a library like xml2js for more robust parsing)
    const items = extractItemsFromXML(xmlText);
    
    return items
      .filter(item => 
        item.title.toLowerCase().includes('mining') ||
        item.title.toLowerCase().includes('galamsey') ||
        item.title.toLowerCase().includes('environment') ||
        item.description?.toLowerCase().includes('mining') ||
        item.description?.toLowerCase().includes('galamsey')
      )
      .slice(0, 5); // Limit to 5 items per source

  } catch (error) {
    console.error(`Error fetching ${sourceName} RSS:`, error);
    return [];
  }
}

// Simple XML parser for RSS feeds
function extractItemsFromXML(xmlText: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  try {
    // Extract items between <item> tags
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/g);
    
    if (!itemMatches) return items;

    for (const itemXml of itemMatches.slice(0, 10)) { // Limit to first 10 items
      const title = extractXMLValue(itemXml, 'title');
      const description = extractXMLValue(itemXml, 'description');
      const pubDate = extractXMLValue(itemXml, 'pubDate');
      const link = extractXMLValue(itemXml, 'link');
      const author = extractXMLValue(itemXml, 'author') || extractXMLValue(itemXml, 'dc:creator');

      // Try to extract image from content or media tags
      let image = extractXMLValue(itemXml, 'media:content');
      if (!image) {
        image = extractImageFromContent(description || '');
      }

      if (title && link) {
        items.push({
          title: cleanText(title),
          author: cleanText(author || ''),
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          image: image || '',
          url: link,
          description: cleanText(description || '').substring(0, 200) + '...',
        });
      }
    }
  } catch (error) {
    console.error('XML parsing error:', error);
  }

  return items;
}

// Helper function to extract values from XML tags
function extractXMLValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

// Helper function to clean HTML and CDATA from text
function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Helper function to extract image URL from HTML content
function extractImageFromContent(content: string): string {
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
  return imgMatch ? imgMatch[1] : '';
}

// Alternative: Use external RSS to JSON API service
interface RSS2JSONItem {
  title: string;
  author?: string;
  pubDate: string;
  link: string;
  description: string;
  enclosure?: {
    link: string;
  };
  thumbnail?: string;
}

interface RSS2JSONResponse {
  status: string;
  items: RSS2JSONItem[];
}

async function fetchViaRSStoJSON(source: string): Promise<NewsItem[]> {
  try {
    const sourceConfig = NEWS_SOURCES[source as keyof typeof NEWS_SOURCES];
    if (!sourceConfig) return [];

    // Using rss2json.com as a proxy service
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(sourceConfig.rss)}&count=10`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`RSS to JSON API error: ${response.status}`);
    }

    const data: RSS2JSONResponse = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(`RSS to JSON returned status: ${data.status}`);
    }

    return data.items
      .filter((item: RSS2JSONItem) => 
        item.title?.toLowerCase().includes('mining') ||
        item.title?.toLowerCase().includes('galamsey') ||
        item.title?.toLowerCase().includes('environment') ||
        item.description?.toLowerCase().includes('mining') ||
        item.description?.toLowerCase().includes('galamsey')
      )
      .map((item: RSS2JSONItem) => ({
        title: item.title,
        author: item.author || `${sourceConfig.name} Team`,
        publishedAt: item.pubDate,
        image: item.enclosure?.link || item.thumbnail || '',
        url: item.link,
        description: item.description?.substring(0, 200) + '...' || '',
      }))
      .slice(0, 5);

  } catch (error) {
    console.error(`RSS to JSON error for ${source}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');

  if (!source || !NEWS_SOURCES[source as keyof typeof NEWS_SOURCES]) {
    return NextResponse.json(
      { error: 'Invalid or missing source parameter' },
      { status: 400 }
    );
  }

  try {
    // Try RSS to JSON service first, fallback to direct RSS parsing
    let newsItems: NewsItem[] = [];
    
    try {
      newsItems = await fetchViaRSStoJSON(source);
    } catch {
      console.log(`RSS to JSON failed for ${source}, trying direct RSS...`);
      const sourceConfig = NEWS_SOURCES[source as keyof typeof NEWS_SOURCES];
      newsItems = await parseRSSFeed(sourceConfig.rss, sourceConfig.name);
    }

    return NextResponse.json(newsItems, {
      headers: {
        'Cache-Control': 's-maxage=600, stale-while-revalidate=1800', // Cache for 10 minutes
      },
    });

  } catch (error) {
    console.error(`Error fetching news for ${source}:`, error);
    
    // Return empty array instead of error to prevent breaking the UI
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 's-maxage=300', // Cache errors for 5 minutes
      },
    });
  }
}
