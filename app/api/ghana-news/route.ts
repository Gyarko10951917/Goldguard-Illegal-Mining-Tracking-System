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
  console.log('Ghana news API endpoint called at:', new Date().toISOString());
  
  try {
    // Use newsdata.io API for Ghana mining/environment news with improved error handling
    const apiUrl = 'https://newsdata.io/api/1/latest?apikey=pub_f2871dcf43ea48bda83c771b5eee40db&q=mining%20OR%20galamsey%20OR%20environment&country=gh&language=en&size=10';
    console.log('Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'GoldGuard/1.0',
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    console.log('API Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('newsdata.io API error response:', errorText);
      throw new Error(`newsdata.io error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const apiData: NewsDataIOResponse = await response.json();
    console.log('API Data received:', { 
      hasResults: !!apiData.results, 
      resultsCount: apiData.results?.length || 0 
    });
    
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

    console.log(`Successfully processed ${newsItems.length} news items`);

    return NextResponse.json({
      success: true,
      articles: newsItems,
      source: 'newsdata.io',
      message: `Fetched ${newsItems.length} articles from newsdata.io`
    });
  } catch (error) {
    console.error('Error fetching Ghana news from newsdata.io:', error);
    
    // Return error response with more detailed information
    return NextResponse.json({
      success: false,
      articles: [],
      source: 'error',
      message: 'Failed to fetch news from newsdata.io API',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}
