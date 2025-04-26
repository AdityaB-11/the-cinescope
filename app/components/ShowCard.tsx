"use client";

import React from "react";
import Image from "next/image";
import { TVShow } from "../types";
import { getFullPosterPath } from "../lib/api";

interface ShowCardProps {
  show: TVShow;
  onWatch: (show: TVShow, idType?: 'tmdb' | 'imdb') => void;
}

export default function ShowCard({ show, onWatch }: ShowCardProps) {
  // Extract just the year from the first air date string
  const getFirstAirYear = (airDate: string): string => {
    if (!airDate || airDate === "Unknown") return "Unknown";
    
    // Handle both "YYYY" and "YYYY-MM-DD" formats
    const yearMatch = airDate.match(/^(\d{4})/);
    return yearMatch ? yearMatch[1] : "Unknown";
  };

  const firstAirYear = getFirstAirYear(show.first_air_date);
  
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
    onWatch(show, idType);
  };

  const hasTmdbId = !!show.tmdb_id;
  const hasImdbId = !!show.imdb_id;
  const hasSeasons = !!show.number_of_seasons && show.number_of_seasons > 0;

  return (
    <div className="show-card flex flex-col h-full">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-lg">
        <Image
          src={getFullPosterPath(show.poster_path)}
          alt={show.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-1">{show.name}</h3>
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm">{firstAirYear}</p>
          {show.vote_average > 0 && renderRating(show.vote_average)}
        </div>
        <p className="text-sm text-gray-300 mb-2 line-clamp-3 flex-grow">
          {show.overview}
        </p>
        
        {hasSeasons && (
          <div className="mb-3">
            <span className="text-xs text-accent">
              {show.number_of_seasons} {show.number_of_seasons === 1 ? 'Season' : 'Seasons'}
              {show.number_of_episodes && ` • ${show.number_of_episodes} Episodes`}
            </span>
          </div>
        )}
        
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
                title={`Open using TMDB ID: ${show.tmdb_id}`}
              >
                via TMDB
              </button>
            )}
            
            {hasImdbId && (
              <button
                onClick={() => handleWatchClick('imdb')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded-full text-xs font-medium flex-1"
                title={`Open using IMDb ID: ${show.imdb_id}`}
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