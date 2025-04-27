import { Movie, TVShow, Media, SearchResult } from "../types";
import { searchMoviesWithGemini, searchTVShowsWithGemini } from "./gemini";

// Fallback poster path for missing images
const PLACEHOLDER_POSTER = "/placeholder-poster.svg";

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query) return [];
  
  try {
    return await searchMoviesWithGemini(query);
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
}

export async function searchTVShows(query: string): Promise<TVShow[]> {
  if (!query) return [];
  
  try {
    console.log("Starting TV show search for:", query);
    const results = await searchTVShowsWithGemini(query);
    
    // Ensure each result has valid properties
    const validatedResults = results.map(show => {
      // Add default values for missing properties to prevent errors
      return {
        ...show,
        name: show.name || "Unknown Show",
        first_air_date: show.first_air_date || "Unknown",
        overview: show.overview || "",
        number_of_seasons: show.number_of_seasons || 1,
        episodes_per_season: show.episodes_per_season || {"1": 10},
        media_type: 'tv'
      };
    });
    
    console.log(`Found ${validatedResults.length} TV shows for query: "${query}"`);
    return validatedResults;
  } catch (error) {
    console.error("Error searching TV shows:", error);
    // Return a fallback empty array instead of crashing
    return [];
  }
}

// Search for all media types (both movies and TV shows)
export async function searchAllMedia(query: string): Promise<Media[]> {
  if (!query) return [];
  
  try {
    console.log("Starting combined media search for:", query);
    
    // Search for both movies and TV shows but handle them independently
    // If one fails, we can still show results from the other
    let movies: Movie[] = [];
    let tvShows: TVShow[] = [];
    
    try {
      movies = await searchMoviesWithGemini(query);
      console.log(`Found ${movies.length} movies for query: "${query}"`);
    } catch (movieError) {
      console.error("Error searching movies:", movieError);
    }
    
    try {
      tvShows = await searchTVShowsWithGemini(query);
      
      // Validate TV show results
      tvShows = tvShows.map(show => ({
        ...show,
        name: show.name || "Unknown Show",
        first_air_date: show.first_air_date || "Unknown",
        overview: show.overview || "",
        number_of_seasons: show.number_of_seasons || 1,
        episodes_per_season: show.episodes_per_season || {"1": 10},
        media_type: 'tv'
      }));
      
      console.log(`Found ${tvShows.length} TV shows for query: "${query}"`);
    } catch (tvError) {
      console.error("Error searching TV shows:", tvError);
    }
    
    // Combine and shuffle results
    const combined = [...movies, ...tvShows];
    console.log(`Combined results: ${combined.length} items`);
    
    return shuffleArray(combined);
  } catch (error) {
    console.error("Error in combined search:", error);
    return [];
  }
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function getMovieDetails(id: number): Promise<Movie | null> {
  try {
    // Since we're no longer using TMDB API, we're just returning 
    // what we already have (or should have) from the search results
    return null;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
}

// Format release date string to extract just the year
export function formatReleaseDate(releaseDate: string): string {
  if (!releaseDate || releaseDate === "Unknown") return "Unknown";
  
  // Handle both "YYYY" and "YYYY-MM-DD" formats
  const yearMatch = releaseDate.match(/^(\d{4})/);
  return yearMatch ? yearMatch[1] : "Unknown";
}

// Hardcoded popular genres since we can't fetch from TMDB
export function getGenres() {
  return [
    { id: 1, name: "Action" },
    { id: 2, name: "Comedy" },
    { id: 3, name: "Drama" },
    { id: 4, name: "Horror" },
    { id: 5, name: "Thriller" },
    { id: 6, name: "Science Fiction" },
    { id: 7, name: "Fantasy" },
    { id: 8, name: "Romance" },
    { id: 9, name: "Adventure" },
    { id: 10, name: "Animation" },
    { id: 11, name: "Documentary" },
    { id: 12, name: "Crime" },
    { id: 13, name: "Family" },
    { id: 14, name: "Mystery" },
    { id: 15, name: "War" }
  ];
}

export function getFullPosterPath(posterPath: string | null): string {
  if (!posterPath) return PLACEHOLDER_POSTER;
  
  // If the posterPath is already a full URL, return it
  if (posterPath.startsWith('http')) {
    return posterPath;
  }
  
  // Otherwise, it's just a placeholder ID, return the placeholder
  return PLACEHOLDER_POSTER;
}

export function getVidFastEmbedUrl(movieId: number | string): string {
  return `https://vidfast.pro/movie/${movieId}`;
}

// Function for TV shows with season and episode
export function getVidFastTVEmbedUrl(showId: number | string, season: number = 1, episode: number = 1): string {
  return `https://vidfast.pro/tv/${showId}/${season}/${episode}?autoPlay=true`;
}

// Function to search for a movie or TV show on IMDb and extract the IMDb ID
export async function searchImdbAndExtractId(title: string, releaseYear?: string, mediaType: string = 'all'): Promise<string | null> {
  try {
    // Add release year to search query if available for better accuracy
    let searchQuery = title;
    if (releaseYear && !isNaN(parseInt(releaseYear))) {
      searchQuery += ` ${releaseYear}`;
    }
    
    console.log(`Making IMDb search request: "${searchQuery}" (${mediaType})`);
    
    // First attempt - try with the original title
    const response = await fetch(`/api/imdb?query=${encodeURIComponent(searchQuery)}&media_type=${mediaType}`);
    if (!response.ok) {
      throw new Error('Failed to fetch IMDb ID');
    }
    
    const data = await response.json();
    
    // If we found an ID, return it
    if (data.imdbId) {
      console.log(`Found IMDb ID in first attempt: ${data.imdbId}`);
      return data.imdbId;
    }
    
    // Second attempt - for TV shows, try with common suffixes
    if (mediaType === 'tv' && !data.imdbId) {
      console.log(`First attempt failed, trying with TV suffixes`);
      
      // TV show common suffixes to try
      const tvSuffixes = [
        ' TV Series',
        ' TV Show',
        ' Series',
        ' Show'
      ];
      
      // Try each suffix one by one
      for (const suffix of tvSuffixes) {
        console.log(`Trying with suffix: "${suffix}"`);
        const tvSearchQuery = title + suffix;
        
        const tvResponse = await fetch(`/api/imdb?query=${encodeURIComponent(tvSearchQuery)}&media_type=tv`);
        if (!tvResponse.ok) continue;
        
        const tvData = await tvResponse.json();
        if (tvData.imdbId) {
          console.log(`Found IMDb ID with suffix "${suffix}": ${tvData.imdbId}`);
          return tvData.imdbId;
        }
      }
    }
    
    // If all attempts failed, return null
    console.log(`All IMDb search attempts failed for "${title}"`);
    return null;
  } catch (error) {
    console.error('Error searching IMDb:', error);
    return null;
  }
}

// Extract IMDb ID from a URL
export function extractImdbIdFromUrl(url: string): string | null {
  // Match IMDb ID pattern (tt followed by numbers)
  const match = url.match(/tt\d+/);
  return match ? match[0] : null;
}

// Format first air date string to extract just the year (for TV shows)
export function formatFirstAirDate(airDate: string): string {
  if (!airDate || airDate === "Unknown") return "Unknown";
  
  // Handle both "YYYY" and "YYYY-MM-DD" formats
  const yearMatch = airDate.match(/^(\d{4})/);
  return yearMatch ? yearMatch[1] : "Unknown";
}

// New function to fetch a poster image for a movie or TV show
export async function fetchPosterImage(
  title: string,
  year?: string,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<string | null> {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('title', title);
    if (year) params.append('year', year);
    params.append('media_type', mediaType);
    
    // First, try the more reliable TMDB endpoint
    const tmdbResponse = await fetch(`/api/tmdb-poster?${params.toString()}`);
    
    if (tmdbResponse.ok) {
      const tmdbData = await tmdbResponse.json();
      if (tmdbData.posterUrl) {
        return tmdbData.posterUrl;
      }
    }
    
    // If TMDB doesn't have a poster, fall back to our AI approach
    const aiResponse = await fetch(`/api/poster-search?${params.toString()}`);
    
    if (!aiResponse.ok) {
      console.error('Error fetching poster:', await aiResponse.text());
      return null;
    }
    
    const aiData = await aiResponse.json();
    return aiData.posterUrl;
  } catch (error) {
    console.error('Error fetching poster:', error);
    return null;
  }
} 