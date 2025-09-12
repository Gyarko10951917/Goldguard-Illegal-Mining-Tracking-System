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
      console.log(`Successfully fetched ${data.articles.length} Ghana news items from newsdata.io`);
      return data.articles;
    }
    
    throw new Error('Invalid API response format');
    
  } catch (error) {
    console.error('Error fetching from API route:', error);
    // Return empty array if API fails
    console.log('API failed, returning empty news array');
    return [];
  }
}
