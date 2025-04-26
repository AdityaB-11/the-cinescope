import { GoogleGenerativeAI } from "@google/generative-ai";
import { Movie, TVShow, Media } from "../types";

// Try both environment variable names
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Track movie titles we've already recommended to avoid repetition
const recommendedMovieTitles = new Set<string>();
const recommendedShowTitles = new Set<string>();

// Track used IDs to avoid duplicates
const usedIds = new Set<number>();

// Generate a unique random ID
function generateUniqueId(): number {
  // Create a timestamp-based ID with added randomness
  let id = Date.now() + Math.floor(Math.random() * 100000);
  
  // Ensure ID is not already used
  while (usedIds.has(id)) {
    id = Date.now() + Math.floor(Math.random() * 100000);
  }
  
  usedIds.add(id);
  return id;
}

// Add this validation function near the top of the file
function validateImdbId(imdbId: string | null | undefined): string | undefined {
  if (!imdbId) return undefined;
  
  // IMDb IDs should start with 'tt' followed by 7-8 digits
  const validFormat = /^tt\d{7,8}$/;
  
  if (validFormat.test(imdbId)) {
    return imdbId;
  }
  
  // Check if it's numeric only, might be missing the 'tt' prefix
  if (/^\d{7,8}$/.test(imdbId)) {
    return `tt${imdbId}`;
  }
  
  // If it has 'tt' but wrong number of digits, it's likely invalid
  if (imdbId.startsWith('tt') && !validFormat.test(imdbId)) {
    return undefined;
  }
  
  return undefined;
}

// Search for movies using Gemini (autocomplete only)
export async function searchMoviesWithGemini(query: string): Promise<Movie[]> {
  if (!apiKey) {
    console.error("Gemini API key not found");
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `I need information about movies matching this search query: "${query}".
Please give me exactly 5 movies that best match this search query.

For each movie, provide:
1. Title (exact movie title)
2. Release year (in YYYY format)
3. A brief 1-2 sentence overview
4. A rating score out of 10

Format STRICTLY as a JSON array with these properties for each movie:
{ "title": "Movie Title", "release_date": "YYYY", "overview": "Brief overview", "vote_average": 7.5 }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Gemini search response");
    }
    
    // Parse the JSON array
    let searchResults: any[] = [];
    try {
      searchResults = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error parsing search JSON:", error);
      // Fallback - try to clean up the JSON before parsing
      const cleanedJson = jsonMatch[0]
        .replace(/(\w+):/g, '"$1":')  // Add quotes to property names
        .replace(/:\s*"([^"]*)"/g, ':"$1"')  // Fix string values
        .replace(/'/g, '"')  // Replace single quotes with double quotes
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']');  // Remove trailing commas
      searchResults = JSON.parse(cleanedJson);
    }
    
    // Map to the Movie interface - now without generating IDs
    return searchResults.map((movie: any, index: number) => {
      // Generate a simple ID based on the index
      const id = Date.now() + index;
      
      return {
        id: id,
        title: movie.title,
        release_date: movie.release_date || "Unknown",
        overview: movie.overview || "",
        vote_average: movie.vote_average || 0,
        poster_path: null,
        media_type: 'movie'
      };
    });
  } catch (error) {
    console.error("Error searching movies with Gemini:", error);
    return [];
  }
}

export async function getMovieRecommendations(
  input: { genre?: string; description?: string; media_type?: 'movie' | 'tv' | 'all' },
  count: number = 3
): Promise<Movie[]> {
  if (!apiKey) {
    console.error("Gemini API key not found");
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Only search for movies (not TV shows for now)
    const mediaType = 'movies';
    
    let prompt = "";
    if (input.genre) {
      prompt = `Recommend exactly ${count} DIFFERENT ${mediaType} in the ${input.genre} genre. Each must be UNIQUE with DIFFERENT stories, styles, and time periods.`;
    } else if (input.description) {
      prompt = `Based on this description: "${input.description}", recommend exactly ${count} DIFFERENT ${mediaType} that match this criteria. Each must be UNIQUE with DIFFERENT stories, styles, and time periods.`;
    } else {
      throw new Error("Either genre or description must be provided");
    }
    
    prompt += ` For each item, provide:
1. Title (exact title only)
2. Release year (exact year in YYYY format)
3. A unique 2-3 sentence overview that's DIFFERENT for each item
4. A rating score out of 10

Format STRICTLY as a JSON array with these properties for each item: 
{ "title": "Title", "release_date": "YYYY", "overview": "Unique overview here...", "vote_average": 7.5 }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Gemini response");
    }
    
    // Parse the JSON array
    let recommendations: any[] = [];
    try {
      recommendations = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      // Fallback - try to clean up the JSON before parsing
      const cleanedJson = jsonMatch[0]
        .replace(/(\w+):/g, '"$1":')  // Add quotes to property names
        .replace(/:\s*"([^"]*)"/g, ':"$1"')  // Fix string values
        .replace(/'/g, '"')  // Replace single quotes with double quotes
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']');  // Remove trailing commas
      recommendations = JSON.parse(cleanedJson);
    }
    
    // Map to the Movie interface without generating IDs
    return recommendations.map((rec: any, index: number) => {
      // Generate a simple ID based on the index
      const id = Date.now() + index + 1000;
      
      return {
        id: id,
        title: rec.title,
        release_date: rec.release_date || "Unknown",
        overview: rec.overview || "",
        vote_average: rec.vote_average || 0,
        poster_path: null,
        media_type: 'movie'
      };
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
}

// Search for TV shows using Gemini
export async function searchTVShowsWithGemini(query: string): Promise<TVShow[]> {
  if (!apiKey) {
    console.error("Gemini API key not found");
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `I need information about TV shows or web series matching this search query: "${query}".
Please give me exactly 5 results that best match this search query. Include both traditional TV shows and streaming/web series.

For each show, provide:
1. Name (exact show title)
2. First air year (in YYYY format)
3. A brief 1-2 sentence overview
4. A rating score out of 10
5. Number of seasons if known
6. A JSON object with seasons as keys and number of episodes as values (e.g., {"1": 10, "2": 12})

Format STRICTLY as a JSON array with these properties for each show:
{ 
  "name": "Show Title", 
  "first_air_date": "YYYY", 
  "overview": "Brief overview", 
  "vote_average": 7.5, 
  "number_of_seasons": 3,
  "episodes_per_season": {"1": 10, "2": 12, "3": 10}
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Gemini search response");
    }
    
    // Parse the JSON array
    let searchResults: any[] = [];
    try {
      searchResults = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error parsing search JSON:", error);
      // Fallback - try to clean up the JSON before parsing
      const cleanedJson = jsonMatch[0]
        .replace(/(\w+):/g, '"$1":')  // Add quotes to property names
        .replace(/:\s*"([^"]*)"/g, ':"$1"')  // Fix string values
        .replace(/'/g, '"')  // Replace single quotes with double quotes
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']');  // Remove trailing commas
      searchResults = JSON.parse(cleanedJson);
    }
    
    // Map to the TVShow interface
    return searchResults.map((show: any, index: number) => {
      // Generate a simple ID based on the index
      const id = Date.now() + index + 5000; // Offset to avoid collision with movie IDs
      
      return {
        id: id,
        name: show.name,
        first_air_date: show.first_air_date || "Unknown",
        overview: show.overview || "",
        vote_average: show.vote_average || 0,
        poster_path: null,
        media_type: 'tv',
        number_of_seasons: show.number_of_seasons || 1,
        number_of_episodes: show.number_of_episodes,
        episodes_per_season: show.episodes_per_season || {"1": 10}
      };
    });
  } catch (error) {
    console.error("Error searching TV shows with Gemini:", error);
    return [];
  }
}

// Get TV show recommendations
export async function getTVShowRecommendations(
  input: { genre?: string; description?: string; media_type?: 'movie' | 'tv' | 'all' },
  count: number = 3
): Promise<TVShow[]> {
  if (!apiKey) {
    console.error("Gemini API key not found");
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    let prompt = "";
    if (input.genre) {
      prompt = `Recommend exactly ${count} DIFFERENT TV shows or web series in the ${input.genre} genre. Include both traditional TV shows and streaming/web series. Each must be UNIQUE with DIFFERENT stories, styles, and time periods.`;
    } else if (input.description) {
      prompt = `Based on this description: "${input.description}", recommend exactly ${count} DIFFERENT TV shows or web series that match this criteria. Include both traditional TV shows and streaming/web series. Each must be UNIQUE with DIFFERENT stories, styles, and time periods.`;
    } else {
      throw new Error("Either genre or description must be provided");
    }
    
    prompt += ` For each TV show, provide:
1. Name (exact title only)
2. First air year (exact year in YYYY format)
3. A unique 2-3 sentence overview that's DIFFERENT for each show
4. A rating score out of 10
5. Number of seasons
6. Approximate total episodes if known
7. A JSON object showing episodes per season (e.g., {"1": 10, "2": 12})

Format STRICTLY as a JSON array with these properties for each show: 
{ "name": "Title", "first_air_date": "YYYY", "overview": "Unique overview here...", "vote_average": 7.5, "number_of_seasons": 3, "number_of_episodes": 30, "episodes_per_season": {"1": 10, "2": 12, "3": 8} }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Gemini response");
    }
    
    // Parse the JSON array
    let recommendations: any[] = [];
    try {
      recommendations = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      // Fallback - try to clean up the JSON before parsing
      const cleanedJson = jsonMatch[0]
        .replace(/(\w+):/g, '"$1":')  // Add quotes to property names
        .replace(/:\s*"([^"]*)"/g, ':"$1"')  // Fix string values
        .replace(/'/g, '"')  // Replace single quotes with double quotes
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']');  // Remove trailing commas
      recommendations = JSON.parse(cleanedJson);
    }
    
    // Map to the TVShow interface
    return recommendations.map((rec: any, index: number) => {
      // Generate a simple ID based on the index
      const id = Date.now() + index + 6000; // Different offset for recommendations
      
      return {
        id: id,
        name: rec.name,
        first_air_date: rec.first_air_date || "Unknown",
        overview: rec.overview || "",
        vote_average: rec.vote_average || 0,
        poster_path: null,
        media_type: 'tv',
        number_of_seasons: rec.number_of_seasons || 1,
        number_of_episodes: rec.number_of_episodes,
        episodes_per_season: rec.episodes_per_season || {"1": 10}
      };
    });
  } catch (error) {
    console.error("Error getting TV show recommendations:", error);
    return [];
  }
}