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
    
    // Return error response instead of mock data
    return NextResponse.json({
      success: false,
      articles: [],
      source: 'error',
      message: 'Failed to fetch news from newsdata.io API',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
