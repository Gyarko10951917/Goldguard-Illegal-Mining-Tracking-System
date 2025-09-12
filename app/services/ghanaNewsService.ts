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
    
    // Check if the response has the expected structure
    if (data && typeof data === 'object' && 'articles' in data) {
      if (data.success) {
        console.log(`Successfully fetched ${data.articles.length} Ghana news items from newsdata.io`);
        return data.articles;
      } else {
        // API returned success: false, but still has articles structure
        console.warn('API returned success: false, message:', data.message);
        console.log('Returning empty array due to API failure');
        return [];
      }
    }
    
    throw new Error('Invalid API response format: missing articles property');
    
  } catch (error) {
    console.error('Error fetching from API route:', error);
    // Return empty array if API fails
    console.log('API failed, returning empty news array');
    return [];
  }
}
