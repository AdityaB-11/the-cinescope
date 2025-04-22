"use client";

import React from "react";
import Image from "next/image";
import { Media, isMovie, isTVShow } from "../types";
import { getFullPosterPath } from "../lib/api";

interface MediaCardProps {
  media: Media;
  onSelect: (media: Media, idType?: 'tmdb' | 'imdb') => void;
}

export default function MediaCard({ media, onSelect }: MediaCardProps) {
  // Get the title depending on whether it's a movie or TV show
  const getTitle = (): string => {
    if (isMovie(media)) {
      return media.title;
    } else if (isTVShow(media)) {
      return media.name;
    }
    return "Unknown Title";
  };

  // Extract just the year from the release date or first air date
  const getReleaseYear = (): string => {
    let dateString = "";
    
    if (isMovie(media)) {
      dateString = media.release_date;
    } else if (isTVShow(media)) {
      dateString = media.first_air_date;
    }
    
    if (!dateString || dateString === "Unknown") return "Unknown";
    
    // Handle both "YYYY" and "YYYY-MM-DD" formats
    const yearMatch = dateString.match(/^(\d{4})/);
    return yearMatch ? yearMatch[1] : "Unknown";
  };
  
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
    onSelect(media, idType);
  };

  const hasTmdbId = !!media.tmdb_id;
  const hasImdbId = !!media.imdb_id;
  const title = getTitle();
  const releaseYear = getReleaseYear();
  const mediaType = isMovie(media) ? "Movie" : "TV Show";

  return (
    <div className="media-card flex flex-col h-full">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-lg">
        <div className="absolute top-2 right-2 z-10 px-2 py-1 text-xs font-medium rounded bg-black/60 text-white">
          {mediaType}
        </div>
        <Image
          src={getFullPosterPath(media.poster_path)}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm">{releaseYear}</p>
          {media.vote_average > 0 && renderRating(media.vote_average)}
        </div>
        {isTVShow(media) && media.number_of_seasons && (
          <p className="text-sm text-blue-400 mb-2">
            {media.number_of_seasons} {media.number_of_seasons === 1 ? 'Season' : 'Seasons'}
            {media.number_of_episodes && ` • ${media.number_of_episodes} Episodes`}
          </p>
        )}
        <p className="text-sm text-gray-300 mb-4 line-clamp-3 flex-grow">
          {media.overview}
        </p>
        
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handleWatchClick()}
            className="neon-button py-2 px-4 rounded-full text-sm font-medium w-full"
          >
            {isMovie(media) ? "Watch Now" : "Watch Series"}
          </button>
          
          <div className="flex space-x-2 mt-2">
            {hasTmdbId && (
              <button
                onClick={() => handleWatchClick('tmdb')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-full text-xs font-medium flex-1"
                title={`Open using TMDB ID: ${media.tmdb_id}`}
              >
                via TMDB
              </button>
            )}
            
            {hasImdbId && (
              <button
                onClick={() => handleWatchClick('imdb')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded-full text-xs font-medium flex-1"
                title={`Open using IMDb ID: ${media.imdb_id}`}
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