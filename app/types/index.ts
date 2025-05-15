// Base interface with common properties for both movies and TV shows
export interface MediaBase {
  id: number | string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  tmdb_id?: number;
  imdb_id?: string;
}

// Movie specific interface
export interface Movie extends MediaBase {
  title: string;
  release_date: string;
  media_type: 'movie';
  runtime?: number; // in minutes
  director?: string;
}

// TV Show specific interface
export interface TVShow extends MediaBase {
  name: string;
  first_air_date: string;
  media_type: 'tv';
  number_of_seasons?: number;
  number_of_episodes?: number;
  episodes_per_season?: {[key: string]: number};
  selected_season?: number;
  selected_episode?: number;
  creators?: string[];
  status?: string; // e.g., "Ended", "Running"
  networks?: string[];
}

// Union type for either a movie or TV show
export type Media = Movie | TVShow;

// Helper type guard to check if media is a movie
export function isMovie(media: Media): media is Movie {
  return media.media_type === 'movie';
}

// Helper type guard to check if media is a TV show
export function isTVShow(media: Media): media is TVShow {
  return media.media_type === 'tv';
}

export interface SearchResult {
  results: Media[];
  total_results: number;
}

export interface RecommendationRequest {
  genre?: string;
  description?: string;
  media_type?: 'movie' | 'tv' | 'all';
}

export interface RecommendationResponse {
  media: Media[];
}

export interface GenreOption {
  id: number;
  name: string;
} 