import { GoogleGenerativeAI } from "@google/generative-ai";
import { Movie } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Track movie titles we've already recommended to avoid repetition
const recommendedMovieTitles = new Set<string>();

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

// Search for movies using Gemini
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
4. A TMDB ID (integer format, e.g., 550 for Fight Club)
5. An IMDb ID (in the format tt1234567)
6. A rating score out of 10

Format STRICTLY as a JSON array with these properties for each movie:
{ "title": "Movie Title", "release_date": "YYYY", "overview": "Brief overview", "tmdb_id": 550, "imdb_id": "tt1234567", "vote_average": 7.5 }

IMPORTANT: Each movie MUST have both a valid TMDB ID in numeric format AND a valid IMDb ID in the format tt1234567. These are critical for my application.`;

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
    
    // Map to the Movie interface
    return searchResults.map((movie: any) => {
      // Use the TMDB ID directly when available, otherwise generate a unique ID
      const tmdbId = typeof movie.tmdb_id === 'number' ? movie.tmdb_id : 
                    (parseInt(movie.tmdb_id, 10) || generateUniqueId());
      
      // Make sure ID is unique
      if (usedIds.has(tmdbId)) {
        // If already used, generate a unique ID
        const uniqueId = generateUniqueId();
        return {
          id: uniqueId,
          title: movie.title,
          release_date: movie.release_date || "Unknown",
          overview: movie.overview || "",
          vote_average: movie.vote_average || 0,
          poster_path: null,
          tmdb_id: tmdbId,
          imdb_id: movie.imdb_id || null
        };
      }
      
      usedIds.add(tmdbId);
      return {
        id: tmdbId,
        title: movie.title,
        release_date: movie.release_date || "Unknown",
        overview: movie.overview || "",
        vote_average: movie.vote_average || 0,
        poster_path: null,
        tmdb_id: tmdbId,
        imdb_id: movie.imdb_id || null
      };
    });
  } catch (error) {
    console.error("Error searching movies with Gemini:", error);
    return [];
  }
}

export async function getMovieRecommendations(
  input: { genre?: string; description?: string },
  count: number = 3
): Promise<Movie[]> {
  if (!apiKey) {
    console.error("Gemini API key not found");
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Get current recommended titles as an array for the prompt
    const alreadyRecommended = Array.from(recommendedMovieTitles).join(", ");
    
    let prompt = "";
    if (input.genre) {
      prompt = `Recommend exactly ${count} DIFFERENT movies in the ${input.genre} genre. Each must be UNIQUE with DIFFERENT stories, styles, and time periods.`;
      if (recommendedMovieTitles.size > 0) {
        prompt += ` DO NOT include these movies I've already seen: ${alreadyRecommended}.`;
      }
    } else if (input.description) {
      prompt = `Based on this description: "${input.description}", recommend exactly ${count} DIFFERENT movies that match this criteria. Each must be UNIQUE with DIFFERENT stories, styles, and time periods.`;
      if (recommendedMovieTitles.size > 0) {
        prompt += ` DO NOT include these movies I've already seen: ${alreadyRecommended}.`;
      }
    } else {
      throw new Error("Either genre or description must be provided");
    }
    
    prompt += ` For each movie, provide:
1. Title (exact movie title only)
2. Release year (exact year in YYYY format)
3. A unique 2-3 sentence overview that's DIFFERENT for each movie
4. A TMDB ID (integer format, e.g., 550 for Fight Club)
5. An IMDb ID (in the format tt1234567) 
6. A rating score out of 10

Format STRICTLY as a JSON array with these properties for each movie: 
{ "title": "Movie Title", "release_date": "YYYY", "overview": "Unique overview here...", "tmdb_id": 550, "imdb_id": "tt1234567", "vote_average": 7.5 }

IMPORTANT: Each movie MUST have both a valid TMDB ID (numeric) AND a valid IMDb ID (format tt1234567). These are critical for my application.`;

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
    
    // Filter out any movies we've already recommended
    const filteredRecommendations = recommendations.filter(rec => 
      !recommendedMovieTitles.has(rec.title)
    );
    
    // Add these titles to our set of recommended movies
    filteredRecommendations.forEach(rec => {
      recommendedMovieTitles.add(rec.title);
    });
    
    // Map to the Movie interface with appropriate IDs
    return filteredRecommendations.map((rec: any) => {
      // Use the TMDB ID directly when available, otherwise generate a unique ID
      const tmdbId = typeof rec.tmdb_id === 'number' ? rec.tmdb_id : 
                    (parseInt(rec.tmdb_id, 10) || generateUniqueId());
      
      // Make sure ID is unique
      if (usedIds.has(tmdbId)) {
        // If already used, generate a unique ID
        const uniqueId = generateUniqueId();
        return {
          id: uniqueId,
          title: rec.title,
          release_date: rec.release_date || "Unknown",
          overview: rec.overview || "",
          vote_average: rec.vote_average || 0,
          poster_path: null,
          tmdb_id: tmdbId,
          imdb_id: rec.imdb_id || null
        };
      }
      
      usedIds.add(tmdbId);
      return {
        id: tmdbId,
        title: rec.title,
        release_date: rec.release_date || "Unknown",
        overview: rec.overview || "",
        vote_average: rec.vote_average || 0,
        poster_path: null,
        tmdb_id: tmdbId,
        imdb_id: rec.imdb_id || null
      };
    });
  } catch (error) {
    console.error("Error getting movie recommendations:", error);
    return [];
  }
}