"use client";

import React from "react";
import Image from "next/image";
import { Movie } from "../types";
import { getFullPosterPath } from "../lib/api";

interface MovieCardProps {
  movie: Movie;
  onWatch: (movie: Movie, idType?: 'tmdb' | 'imdb') => void;
}

export default function MovieCard({ movie, onWatch }: MovieCardProps) {
  // Extract just the year from the release date string
  const getReleaseYear = (releaseDate: string): string => {
    if (!releaseDate || releaseDate === "Unknown") return "Unknown";
    
    // Handle both "YYYY" and "YYYY-MM-DD" formats
    const yearMatch = releaseDate.match(/^(\d{4})/);
    return yearMatch ? yearMatch[1] : "Unknown";
  };

  const releaseYear = getReleaseYear(movie.release_date);
  
  // Generate rating stars based on vote_average (out of 10)
  const renderRating = (rating: number): React.ReactElement => {
    const MAX_STARS = 5; // 5 stars for a 10/10 rating
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;
    
    return (
      <div className="flex items-center text-xs text-gray-400 mt-1">
        <span className="mr-1">{rating.toFixed(1)}</span>
        <div className="flex">
          {[...Array(MAX_STARS)].map((_, i) => (
            <span key={i} className={i < fullStars ? "text-accent" : i === fullStars && hasHalfStar ? "text-accent opacity-50" : "text-gray-700"}>
              ★
            </span>
          ))}
        </div>
      </div>
    );
  };

  const handleWatchClick = (idType?: 'tmdb' | 'imdb') => {
    onWatch(movie, idType);
  };

  const hasTmdbId = !!movie.tmdb_id;
  const hasImdbId = !!movie.imdb_id;

  return (
    <div className="movie-card flex flex-col h-full">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-lg">
        <Image
          src={getFullPosterPath(movie.poster_path)}
          alt={movie.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-1">{movie.title}</h3>
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm">{releaseYear}</p>
          {movie.vote_average > 0 && renderRating(movie.vote_average)}
        </div>
        <p className="text-sm text-gray-300 mb-4 line-clamp-3 flex-grow">
          {movie.overview}
        </p>
        
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handleWatchClick()}
            className="neon-button py-2 px-4 rounded-full text-sm font-medium w-full"
          >
            Watch Now
          </button>
          
          <div className="flex space-x-2 mt-2">
            {hasTmdbId && (
              <button
                onClick={() => handleWatchClick('tmdb')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-full text-xs font-medium flex-1"
                title={`Open using TMDB ID: ${movie.tmdb_id}`}
              >
                via TMDB
              </button>
            )}
            
            {hasImdbId && (
              <button
                onClick={() => handleWatchClick('imdb')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded-full text-xs font-medium flex-1"
                title={`Open using IMDb ID: ${movie.imdb_id}`}
              >
                via IMDb
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 