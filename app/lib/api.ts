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
    return await searchTVShowsWithGemini(query);
  } catch (error) {
    console.error("Error searching TV shows:", error);
    return [];
  }
}

// Search for all media types (both movies and TV shows)
export async function searchAllMedia(query: string): Promise<Media[]> {
  if (!query) return [];
  
  try {
    // Search for both movies and TV shows in parallel
    const [movies, tvShows] = await Promise.all([
      searchMoviesWithGemini(query),
      searchTVShowsWithGemini(query)
    ]);
    
    // Combine and shuffle results
    const combined = [...movies, ...tvShows];
    return shuffleArray(combined);
  } catch (error) {
    console.error("Error searching all media:", error);
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
    
    // Use our server API endpoint instead of direct fetching
    const response = await fetch(`/api/imdb?query=${encodeURIComponent(searchQuery)}&media_type=${mediaType}`);
    if (!response.ok) {
      throw new Error('Failed to fetch IMDb ID');
    }
    
    const data = await response.json();
    return data.imdbId || null;
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