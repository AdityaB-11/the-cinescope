export interface Movie {
  id: number | string;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
  tmdb_id?: number;
  imdb_id?: string;
}

export interface SearchResult {
  results: Movie[];
  total_results: number;
}

export interface RecommendationRequest {
  genre?: string;
  description?: string;
}

export interface RecommendationResponse {
  movies: Movie[];
}

export interface GenreOption {
  id: number;
  name: string;
} 