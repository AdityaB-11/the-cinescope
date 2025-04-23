import { Movie, SearchResult } from "../types";
import { searchMoviesWithGemini } from "./gemini";

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
  // Add parameters to prevent ad redirects
  return `https://vidfast.pro/movie/${movieId}?autoplay=0&ads=0&fullscreen=0`;
}

// Function to search for a movie on IMDb and extract the IMDb ID
export async function searchImdbAndExtractId(title: string): Promise<string | null> {
  try {
    // Use our server API endpoint instead of direct fetching
    const response = await fetch(`/api/imdb?query=${encodeURIComponent(title)}`);
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