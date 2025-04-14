"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Movie } from "../types";
import { getFullPosterPath } from "../lib/api";

interface SearchBarProps {
  onMovieSelect: (movie: Movie, idType?: 'tmdb' | 'imdb') => void;
}

export default function SearchBar({ onMovieSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showIdSearch, setShowIdSearch] = useState(false);
  const [movieId, setMovieId] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showIdSearch) return; // Skip normal search if ID search is active
    
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Search failed");
        
        const data = await response.json();
        setResults(data.results);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, showIdSearch]);

  const playMovieDirectlyById = (idType?: 'tmdb' | 'imdb') => {
    if (!movieId.trim()) {
      alert("Please enter a valid ID");
      return;
    }
    
    // Determine if it looks like an IMDb ID
    const isImdbId = movieId.startsWith('tt') && /^tt\d+$/.test(movieId);
    const explicitIdType = idType || (isImdbId ? 'imdb' : 'tmdb');
    
    // Create a minimal movie object with the ID for the player
    const directMovie: Movie = {
      // For the main ID, use a numeric value if possible, otherwise use the ID as-is
      id: isImdbId ? movieId : (parseInt(movieId) || movieId),
      title: `Movie ID: ${movieId}`,
      overview: "",
      poster_path: null,
      release_date: "",
      vote_average: 0
    };
    
    // Add appropriate ID properties based on format
    if (isImdbId || explicitIdType === 'imdb') {
      directMovie.imdb_id = movieId;
    } else if (/^\d+$/.test(movieId) || explicitIdType === 'tmdb') {
      // If it's purely numeric, it's likely a TMDB ID
      directMovie.tmdb_id = parseInt(movieId) || undefined;
    }
    
    // Pass the movie object to the player with the explicit ID type if provided
    onMovieSelect(directMovie, explicitIdType);
    setMovieId("");
    setShowIdSearch(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (movie: Movie, idType?: 'tmdb' | 'imdb') => {
    onMovieSelect(movie, idType);
    setQuery("");
    setShowDropdown(false);
  };

  const toggleSearchMode = () => {
    setShowIdSearch(!showIdSearch);
    setShowDropdown(false);
    setQuery("");
    setMovieId("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative" ref={searchRef}>
      <div className="flex mb-2 justify-end">
        <button 
          onClick={toggleSearchMode}
          className="text-sm text-accent hover:underline"
        >
          {showIdSearch ? "Search by title" : "Play by ID directly"}
        </button>
      </div>
    
      {!showIdSearch ? (
        // Normal Search UI
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a movie..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-t-2 border-accent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        // Direct ID Play UI
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            placeholder="Enter TMDB ID (numeric) or IMDb ID (tt1234567)"
            value={movieId}
            onChange={(e) => setMovieId(e.target.value.trim())}
            className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => playMovieDirectlyById()}
              disabled={!movieId.trim()}
              className="flex-1 px-4 py-3 bg-accent rounded-lg text-white font-medium focus:outline-none disabled:opacity-50"
            >
              Play Auto
            </button>
            <button
              onClick={() => playMovieDirectlyById('tmdb')}
              disabled={!movieId.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium focus:outline-none disabled:opacity-50"
            >
              via TMDB
            </button>
            <button
              onClick={() => playMovieDirectlyById('imdb')}
              disabled={!movieId.trim()}
              className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-medium focus:outline-none disabled:opacity-50"
            >
              via IMDb
            </button>
          </div>
        </div>
      )}

      {showDropdown && results.length > 0 && !showIdSearch && (
        <div className="absolute z-10 w-full mt-1 bg-gray-900 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((movie, index) => (
            <div
              key={`search-${movie.id}-${index}`}
              className="flex items-center p-3 border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
            >
              <div className="flex-shrink-0 w-12 h-18 relative">
                <Image
                  src={getFullPosterPath(movie.poster_path)}
                  alt={movie.title}
                  width={48}
                  height={72}
                  className="rounded object-cover"
                />
              </div>
              <div className="ml-3 flex-grow">
                <div className="font-medium">{movie.title}</div>
                <div className="text-sm text-gray-400">
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : "Unknown"}
                  {movie.tmdb_id && <span className="ml-2">TMDB: {movie.tmdb_id}</span>}
                  {movie.imdb_id && <span className="ml-2">IMDb: {movie.imdb_id}</span>}
                </div>
              </div>
              <div className="flex space-x-1 ml-2">
                <button
                  onClick={() => handleSelect(movie)}
                  className="bg-accent text-xs hover:bg-accent/80 text-black py-1 px-2 rounded"
                >
                  Watch
                </button>
                {movie.tmdb_id && (
                  <button
                    onClick={() => handleSelect(movie, 'tmdb')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                  >
                    TMDB
                  </button>
                )}
                {movie.imdb_id && (
                  <button
                    onClick={() => handleSelect(movie, 'imdb')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1 px-2 rounded"
                  >
                    IMDb
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 