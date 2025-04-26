"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Movie, Media, isMovie, isTVShow, TVShow } from "../types";
import { getFullPosterPath } from "../lib/api";

interface SearchBarProps {
  onMovieSelect: (media: Media) => void;
}

export default function SearchBar({ onMovieSelect }: SearchBarProps) {
  // Standard search states
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showIdSearch, setShowIdSearch] = useState(false);
  const [mediaId, setMediaId] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  
  // New states for enhanced functionality
  const [searchMode, setSearchMode] = useState<'all' | 'movies' | 'tv'>('all');
  const [showSeasonEpisodeSelector, setShowSeasonEpisodeSelector] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<TVShow | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [totalSeasons, setTotalSeasons] = useState(1);
  const [episodesPerSeason, setEpisodesPerSeason] = useState<{[key: number]: number}>({});

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
        // Use different endpoints or params based on search mode
        let endpoint = '/api/search';
        if (searchMode !== 'all') {
          endpoint += `?query=${encodeURIComponent(query)}&media_type=${searchMode}`;
        } else {
          endpoint += `?query=${encodeURIComponent(query)}`;
        }
        
        const response = await fetch(endpoint);
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
  }, [query, showIdSearch, searchMode]);

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
    if (isTVShow(media)) {
      // For TV shows, show the season/episode selector
      setSelectedMedia(media as TVShow);
      setShowSeasonEpisodeSelector(true);
      
      // Set up season/episode data
      const totalSeasons = (media as TVShow).number_of_seasons || 1;
      setTotalSeasons(totalSeasons);
      
      // Use episodes_per_season if available, otherwise use defaults
      if ((media as TVShow).episodes_per_season) {
        const episodesMap: {[key: number]: number} = {};
        // Convert string keys to numbers
        Object.entries((media as TVShow).episodes_per_season || {}).forEach(([season, count]) => {
          episodesMap[parseInt(season)] = count;
        });
        setEpisodesPerSeason(episodesMap);
      } else {
        // Default episodes per season (10 is a common number)
        const defaultEpisodesPerSeason: {[key: number]: number} = {};
        for (let i = 1; i <= totalSeasons; i++) {
          defaultEpisodesPerSeason[i] = 10;
        }
        setEpisodesPerSeason(defaultEpisodesPerSeason);
      }
      
      setSelectedSeason(1);
      setSelectedEpisode(1);
    } else {
      // For movies, directly pass to player
      onMovieSelect(media);
      setQuery("");
      setShowDropdown(false);
    }
  };

  const handleWatchTVShow = () => {
    if (selectedMedia) {
      // Add the selected season and episode to the media object
      const enhancedMedia: TVShow = {
        ...selectedMedia,
        selected_season: selectedSeason,
        selected_episode: selectedEpisode
      };
      
      onMovieSelect(enhancedMedia);
      setShowSeasonEpisodeSelector(false);
      setSelectedMedia(null);
      setQuery("");
      setShowDropdown(false);
    }
  };

  const toggleSearchMode = () => {
    setShowIdSearch(!showIdSearch);
    setShowDropdown(false);
    setQuery("");
    setMediaId("");
  };

  const changeSearchMode = (mode: 'all' | 'movies' | 'tv') => {
    setSearchMode(mode);
    if (query.length >= 2) {
      // Re-search with the new mode
      setIsLoading(true);
    }
  };

  // Generate season options
  const renderSeasonOptions = () => {
    return Array.from({ length: totalSeasons }, (_, i) => i + 1).map(season => (
      <option key={`season-${season}`} value={season}>
        Season {season}
      </option>
    ));
  };
  
  // Generate episode options
  const renderEpisodeOptions = () => {
    const episodeCount = episodesPerSeason[selectedSeason] || 10;
    return Array.from({ length: episodeCount }, (_, i) => i + 1).map(episode => (
      <option key={`episode-${episode}`} value={episode}>
        Episode {episode}
      </option>
    ));
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative" ref={searchRef}>
      <div className="flex mb-2 justify-between items-center">
        {/* Search Type Buttons */}
        <div className="flex space-x-2">
          <button 
            onClick={() => changeSearchMode('all')}
            className={`px-3 py-1 text-sm rounded-full ${searchMode === 'all' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
          >
            All Content
          </button>
          <button 
            onClick={() => changeSearchMode('movies')}
            className={`px-3 py-1 text-sm rounded-full ${searchMode === 'movies' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
          >
            Movies
          </button>
          <button 
            onClick={() => changeSearchMode('tv')}
            className={`px-3 py-1 text-sm rounded-full ${searchMode === 'tv' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
          >
            TV & Web Series
          </button>
        </div>
        
        {/* Direct ID Play Link */}
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
            placeholder={`Search for ${searchMode === 'movies' ? 'movies' : searchMode === 'tv' ? 'TV shows & web series' : 'content'}...`}
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

      {/* Season & Episode Selector Modal */}
      {showSeasonEpisodeSelector && selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{selectedMedia.name}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Season:</label>
              <select
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(Number(e.target.value));
                  setSelectedEpisode(1); // Reset episode when season changes
                }}
                className="w-full bg-gray-800 text-white rounded px-3 py-2"
              >
                {renderSeasonOptions()}
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Episode:</label>
              <select
                value={selectedEpisode}
                onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                className="w-full bg-gray-800 text-white rounded px-3 py-2"
              >
                {renderEpisodeOptions()}
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleWatchTVShow}
                className="flex-1 neon-button py-2 px-4 rounded-full text-sm font-medium"
              >
                Watch S{selectedSeason}:E{selectedEpisode}
              </button>
              <button 
                onClick={() => {
                  setShowSeasonEpisodeSelector(false);
                  setSelectedMedia(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-full text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
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
            const mediaType = media.media_type === 'tv' ? 'TV Show' : 'Movie';
            
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
                    {releaseYear} • <span className="text-accent">{mediaType}</span>
                    {isTVShow(media) && media.number_of_seasons && (
                      <span className="ml-1">• {media.number_of_seasons} {media.number_of_seasons === 1 ? 'Season' : 'Seasons'}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                    {overview}
                  </div>
                </div>
                <div className="ml-2 opacity-70 transition-opacity group-hover:opacity-100">
                  <div className="text-accent text-xs p-1">
                    {isTVShow(media) ? "Select Episodes" : "Click to Watch"}
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