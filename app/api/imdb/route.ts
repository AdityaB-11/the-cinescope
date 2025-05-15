import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Get the query parameter
  const url = new URL(request.url);
  const query = url.searchParams.get('query');
  const mediaType = url.searchParams.get('media_type') || 'all'; // 'movie', 'tv', or 'all'
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  try {
    // Scrape IMDb for the ID
    const imdbId = await scrapeImdbId(query, mediaType);
    
    return NextResponse.json({ imdbId });
  } catch (error) {
    console.error('Error scraping IMDb:', error);
    return NextResponse.json({ error: 'Failed to scrape IMDb ID' }, { status: 500 });
  }
}

async function scrapeImdbId(title: string, mediaType: string = 'all'): Promise<string | null> {
  try {
    // First attempt: Direct search with type parameter
    let typeParam = '';
    if (mediaType === 'movie') {
      typeParam = '&ttype=ft'; // Feature films
    } else if (mediaType === 'tv') {
      typeParam = '&ttype=tv'; // TV series
    }
    
    // Encode the title for the search URL
    const searchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(title)}${typeParam}&s=tt&exact=true`;
    
    console.log(`Searching IMDb with URL: ${searchUrl}`);
    
    // Fetch the search results page
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch IMDb search results: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Pattern to extract IMDb ID from search results
    // This regex looks for tt followed by digits in a URL pattern
    const imdbIdRegex = /\/title\/(tt\d+)/;
    const match = html.match(imdbIdRegex);
    
    if (match && match[1]) {
      console.log(`Found IMDb ID: ${match[1]} for "${title}"`);
      return match[1]; // Return the IMDb ID
    }
    
    // Second attempt: Try without 'exact' parameter
    if (!match) {
      console.log("First attempt failed, trying less strict search...");
      const fallbackUrl = `https://www.imdb.com/find?q=${encodeURIComponent(title)}${typeParam}&s=tt`;
      
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (fallbackResponse.ok) {
        const fallbackHtml = await fallbackResponse.text();
        const fallbackMatch = fallbackHtml.match(imdbIdRegex);
        
        if (fallbackMatch && fallbackMatch[1]) {
          console.log(`Found IMDb ID (fallback): ${fallbackMatch[1]} for "${title}"`);
          return fallbackMatch[1];
        }
      }
    }
    
    // Third attempt: Use more specific search for TV shows
    if (mediaType === 'tv' && !match) {
      console.log("Trying TV-specific search for:", title);
      // Try adding "TV Series" to the query for TV shows
      const tvSpecificUrl = `https://www.imdb.com/find?q=${encodeURIComponent(title + " TV Series")}&s=tt`;
      
      const tvResponse = await fetch(tvSpecificUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (tvResponse.ok) {
        const tvHtml = await tvResponse.text();
        const tvMatch = tvHtml.match(imdbIdRegex);
        
        if (tvMatch && tvMatch[1]) {
          console.log(`Found IMDb ID (TV-specific): ${tvMatch[1]} for "${title}"`);
          return tvMatch[1];
        }
      }
    }
    
    console.log(`No IMDb ID found for "${title}" after multiple attempts`);
    return null;
  } catch (error) {
    console.error(`Error scraping IMDb ID for ${title}:`, error);
    return null;
  }
} 