# Ghana News Integration

GoldGuard now fetches real Ghana news headlines using free/freemium news APIs.

## Features

✅ **Real Ghana News**: Fetches latest headlines about Ghana, mining, and environmental issues
✅ **Multiple API Support**: Uses NewsAPI.org and other free APIs
✅ **Automatic Fallback**: Shows curated Ghana news if APIs are unavailable
✅ **Auto-refresh**: Updates every 30 minutes
✅ **Error Handling**: Graceful fallback to mock data

## API Integration

### Free APIs Used:

1. **NewsAPI.org** (Free tier: 100 requests/day)
   - Get free API key: https://newsapi.org/register
   - Searches for: Ghana mining, illegal mining, environmental news

2. **NewsData.io** (Free tier: 200 requests/day)  
   - Get free API key: https://newsdata.io/register
   - Filters by: Ghana country, politics/environment categories

### Setup Instructions:

1. **With API Keys** (Recommended for real news):
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Add your API keys to .env.local:
   NEXT_PUBLIC_NEWS_API_KEY=your_newsapi_key_here
   NEXT_PUBLIC_NEWSDATA_API_KEY=your_newsdata_key_here
   ```

2. **Without API Keys** (Uses mock data):
   - App works perfectly with curated Ghana news content
   - No setup required

### How It Works:

```
1. App calls /api/ghana-news endpoint
2. Server tries to fetch from NewsAPI with Ghana-specific queries
3. If API fails/unavailable, returns high-quality mock Ghana news
4. News updates every 30 minutes automatically
5. User can manually refresh anytime
```

## Ghana News Sources

When using mock data, news is curated from these Ghana sources:
- Ghana Web
- Citi News  
- Joy News
- Modern Ghana
- Graphic Online
- Ghana Business News

All content focuses on:
- Illegal mining (galamsey) news
- Environmental protection
- Government policies
- Community initiatives
- Mining regulations

## Performance

- ✅ Fast loading with loading indicators
- ✅ Cached API responses (30 min cache)
- ✅ Graceful error handling
- ✅ Responsive design
- ✅ SEO friendly

The system provides an excellent user experience whether using real APIs or fallback data!
