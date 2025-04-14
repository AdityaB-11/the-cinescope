"use client";

import React, { useState, useEffect, useCallback } from "react";
import MovieCard from "./MovieCard";
import { Movie, GenreOption } from "../types";
import { formatReleaseDate } from '../lib/api';
import { getMovieRecommendations } from '../lib/gemini';

interface RecommenderProps {
  onMovieSelect: (movie: Movie) => void;
}

// Year range for selection dropdown
const YEAR_RANGES = Array.from({ length: 13 }, (_, i) => 1930 + (i * 10));

const Recommender: React.FC<RecommenderProps> = ({ onMovieSelect }) => {
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Year filter states
  const [startYear, setStartYear] = useState<number>(0);
  const [yearRange, setYearRange] = useState<number>(0);
  const [filterByYear, setFilterByYear] = useState<boolean>(false);

  // Keep track of recommended movie titles to avoid duplicates in UI
  const [recommendedTitles, setRecommendedTitles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch("/api/genres");
        if (!response.ok) throw new Error("Failed to fetch genres");
        
        const data = await response.json();
        setGenres(data.genres);
      } catch (error) {
        console.error("Error fetching genres:", error);
        setError("Failed to load genres. Please try again later.");
      }
    };

    fetchGenres();
  }, []);

  const handleGetRecommendations = async (more: boolean = false) => {
    if (!selectedGenre && !description) {
      setError("Please select a genre or enter a description");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          genre: selectedGenre || undefined,
          description: description || undefined,
          count: 3,
        }),
      });

      if (!response.ok) throw new Error("Failed to get recommendations");
      
      const data = await response.json();
      
      if (!Array.isArray(data.movies) || data.movies.length === 0) {
        throw new Error("No recommendations found");
      }
      
      // Filter any movies that match titles we've already seen
      let newMovies = data.movies.filter((movie: Movie) => 
        !recommendedTitles.has(movie.title)
      );
      
      // Filter by year if enabled
      if (filterByYear && startYear > 0 && yearRange > 0) {
        const endYear = startYear + yearRange;
        newMovies = newMovies.filter((movie: Movie) => {
          if (!movie.release_date || typeof movie.release_date !== 'string') {
            return false;
          }
          const releaseYear = parseInt(formatReleaseDate(movie.release_date));
          return !isNaN(releaseYear) && 
                releaseYear >= startYear && 
                releaseYear <= endYear;
        });
      }
      
      if (newMovies.length === 0 && more) {
        setError("No more unique recommendations available. Try a different genre or description.");
        setIsLoading(false);
        return;
      }
      
      // Update our set of recommended titles
      const updatedTitles = new Set(recommendedTitles);
      newMovies.forEach((movie: Movie) => {
        updatedTitles.add(movie.title);
      });
      setRecommendedTitles(updatedTitles);
      
      // Update recommendations state
      if (more) {
        setRecommendations((prev) => [...prev, ...newMovies]);
      } else {
        setRecommendations(newMovies);
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      setError(error instanceof Error ? error.message : "Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearRecommendations = () => {
    setRecommendations([]);
    setRecommendedTitles(new Set());
  };

  const loadRecommendations = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError("");

      const result = await getMovieRecommendations(
        {
          genre: selectedGenre || undefined,
          description: description || undefined
        },
        3
      );
      
      // Filter out any recommendations that have the same ID or title as existing ones
      let uniqueNewRecommendations = result.filter((newMovie: Movie) => 
        !recommendations.some(existingMovie => 
          existingMovie.id === newMovie.id || 
          existingMovie.title.toLowerCase() === newMovie.title.toLowerCase()
        )
      );
      
      // Filter by year if enabled
      if (filterByYear && startYear > 0 && yearRange > 0) {
        const endYear = startYear + yearRange;
        uniqueNewRecommendations = uniqueNewRecommendations.filter((movie: Movie) => {
          if (!movie.release_date || typeof movie.release_date !== 'string') {
            return false;
          }
          const releaseYear = parseInt(formatReleaseDate(movie.release_date));
          return !isNaN(releaseYear) && 
                releaseYear >= startYear && 
                releaseYear <= endYear;
        });
      }

      if (uniqueNewRecommendations.length === 0) {
        setError("Couldn't find new unique recommendations. Please try again.");
        return;
      }

      setRecommendations(prev => [...prev, ...uniqueNewRecommendations]);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setError("Failed to load recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get filtered recommendations
  const getFilteredRecommendations = () => {
    if (!filterByYear || startYear === 0 || yearRange === 0) {
      return recommendations;
    }
    
    const endYear = startYear + yearRange;
    return recommendations.filter(movie => {
      if (!movie.release_date || typeof movie.release_date !== 'string') {
        return false;
      }
      const releaseYear = parseInt(formatReleaseDate(movie.release_date));
      return !isNaN(releaseYear) && 
            releaseYear >= startYear && 
            releaseYear <= endYear;
    });
  };

  const filteredRecommendations = getFilteredRecommendations();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Movie Recommender</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select a genre:
          </label>
          <select
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              setDescription("");
              if (recommendations.length > 0) clearRecommendations();
            }}
            className="w-full p-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select a genre</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.name}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium">Or</span>
            <div className="flex-grow border-t border-gray-700 mx-4"></div>
          </div>
          
          <label className="block text-sm font-medium mb-2">
            Describe the kind of movie you want:
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSelectedGenre("");
              if (recommendations.length > 0) clearRecommendations();
            }}
            className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
            rows={3}
            placeholder="E.g., A feel-good movie about friendship"
          ></textarea>
        </div>

        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="filterByYear"
              checked={filterByYear}
              onChange={(e) => setFilterByYear(e.target.checked)}
              className="mr-2 h-4 w-4 accent-accent"
            />
            <label htmlFor="filterByYear" className="text-sm font-medium">
              Filter by release year
            </label>
          </div>
          
          {filterByYear && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Starting Year:
                </label>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(parseInt(e.target.value))}
                  className="w-full p-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="0">Select year</option>
                  {YEAR_RANGES.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Year Range:
                </label>
                <select
                  value={yearRange}
                  onChange={(e) => setYearRange(parseInt(e.target.value))}
                  disabled={startYear === 0}
                  className="w-full p-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                >
                  <option value="0">Select range</option>
                  <option value="5">5 years</option>
                  <option value="10">10 years</option>
                  <option value="20">20 years</option>
                  <option value="30">30 years</option>
                  <option value="50">50 years</option>
                  <option value="100">100 years</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={() => handleGetRecommendations(false)}
          disabled={isLoading}
          className="neon-button py-2 px-6 rounded-full font-medium"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting Recommendations...
            </span>
          ) : (
            "Get Recommendations"
          )}
        </button>
      </div>

      {filteredRecommendations.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">
            Recommended Movies
            {filterByYear && startYear > 0 && yearRange > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({startYear} - {startYear + yearRange})
              </span>
            )}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredRecommendations.map((movie, index) => (
              <MovieCard
                key={`movie-${movie.id}-${index}`}
                movie={movie}
                onWatch={onMovieSelect}
              />
            ))}
          </div>
          
          {filteredRecommendations.length === 0 && recommendations.length > 0 && (
            <p className="text-gray-400 text-center py-8">
              No movies match your year filter. Try adjusting the year range or disabling the filter.
            </p>
          )}
          
          <div className="flex justify-center">
            <button
              onClick={() => handleGetRecommendations(true)}
              disabled={isLoading}
              className="bg-gray-800 text-white py-2 px-6 rounded-full hover:bg-gray-700 transition-colors mr-4"
            >
              {isLoading ? "Loading..." : "Load More"}
            </button>
            
            <button
              onClick={clearRecommendations}
              className="border border-gray-700 text-gray-300 py-2 px-6 rounded-full hover:bg-gray-800 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommender; 