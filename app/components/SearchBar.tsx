"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Movie, Media, isMovie, isTVShow } from "../types";
import { getFullPosterPath } from "../lib/api";

interface SearchBarProps {
  onMovieSelect: (media: Media) => void;
}

export default function SearchBar({ onMovieSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showIdSearch, setShowIdSearch] = useState(false);
  const [mediaId, setMediaId] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Function to extract the first sentence from a text
  const getFirstSentence = (text: string): string => {
    if (!text) return "";
    const match = text.match(/^(.*?[.!?])\s/);
    return match ? match[1] : text.substring(0, 80) + (text.length > 80 ? '...' : '');
  };

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

  const playMediaDirectlyById = () => {
    if (!mediaId.trim()) {
      alert("Please enter a valid ID");
      return;
    }
    
    // Create a minimal media object with the ID for the player
    const directMedia: Media = {
      id: mediaId,
      title: `Content ID: ${mediaId}`,
      overview: "",
      poster_path: null,
      release_date: "",
      vote_average: 0,
      media_type: 'movie'
    };
    
    // Pass the media object to the player
    onMovieSelect(directMedia);
    setMediaId("");
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

  const handleSelect = (media: Media) => {
    onMovieSelect(media);
    setQuery("");
    setShowDropdown(false);
  };

  const toggleSearchMode = () => {
    setShowIdSearch(!showIdSearch);
    setShowDropdown(false);
    setQuery("");
    setMediaId("");
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
            placeholder="Search for content..."
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
            placeholder="Enter content ID"
            value={mediaId}
            onChange={(e) => setMediaId(e.target.value.trim())}
            className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={playMediaDirectlyById}
            disabled={!mediaId.trim()}
            className="w-full px-4 py-3 bg-accent rounded-lg text-white font-medium focus:outline-none disabled:opacity-50"
          >
            Play Content
          </button>
        </div>
      )}

      {showDropdown && results.length > 0 && !showIdSearch && (
        <div className="absolute z-10 w-full mt-1 bg-gray-900 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((media, index) => {
            const title = isMovie(media) ? media.title : (media as any).name || 'Unknown';
            // Get release year differently based on media type
            const releaseYear = isMovie(media) 
              ? (media.release_date ? new Date(media.release_date).getFullYear() : "Unknown")
              : (isTVShow(media) && media.first_air_date 
                  ? new Date(media.first_air_date).getFullYear() 
                  : "Unknown");
            
            const overview = getFirstSentence(media.overview);
            
            return (
              <div
                key={`search-${media.id}-${index}`}
                className="flex items-center p-3 border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => handleSelect(media)}
              >
                <div className="flex-shrink-0 w-12 h-18 relative">
                  <Image
                    src={getFullPosterPath(media.poster_path)}
                    alt={title}
                    width={48}
                    height={72}
                    className="rounded object-cover"
                  />
                </div>
                <div className="ml-3 flex-grow">
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-gray-400">
                    {releaseYear}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                    {overview}
                  </div>
                </div>
                <div className="ml-2 opacity-70 transition-opacity group-hover:opacity-100">
                  <div className="text-accent text-xs p-1">
                    Click to Watch
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 