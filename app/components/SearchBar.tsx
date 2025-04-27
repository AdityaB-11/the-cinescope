"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Movie, Media, isMovie, isTVShow, TVShow } from "../types";
import { getFullPosterPath, fetchPosterImage, searchImdbAndExtractId } from "../lib/api";

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
  
  // Play by ID - TV show specific states
  const [isShowContent, setIsShowContent] = useState(false);
  const [showId, setShowId] = useState("");
  const [showSeason, setShowSeason] = useState("1");
  const [showEpisode, setShowEpisode] = useState("1");
  const [showIdType, setShowIdType] = useState<'imdb' | 'tmdb'>('imdb');
  
  // State for poster URLs
  const [posterUrls, setPosterUrls] = useState<{[key: string]: string}>({});

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

      console.log(`Starting search for: "${query}" in mode: ${searchMode}`);
      setIsLoading(true);
      try {
        // Use different endpoints or params based on search mode
        let endpoint = '/api/search';
        if (searchMode !== 'all') {
          endpoint += `?query=${encodeURIComponent(query)}&media_type=${searchMode}`;
        } else {
          endpoint += `?query=${encodeURIComponent(query)}`;
        }
        
        console.log(`Making fetch request to: ${endpoint}`);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          console.error(`Search request failed with status: ${response.status}`);
          throw new Error("Search failed");
        }
        
        const data = await response.json();
        console.log(`Received ${data.results ? data.results.length : 0} search results`);
        
        if (data.results && Array.isArray(data.results)) {
          console.log("Search results:", data.results);
          setResults(data.results);
          setShowDropdown(true);
        } else {
          console.error("Invalid search results format:", data);
          setResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, showIdSearch, searchMode]);

  // Fetch poster images whenever results change
  useEffect(() => {
    const fetchPosters = async () => {
      const newPosterUrls: {[key: string]: string} = {...posterUrls};
      
      for (const media of results) {
        const mediaKey = `${media.id}-${media.media_type}`;
        
        // Skip if we already have this poster URL
        if (newPosterUrls[mediaKey]) continue;
        
        // Initially set with the default poster path
        newPosterUrls[mediaKey] = getFullPosterPath(media.poster_path);
        
        // If no poster path or it's already a full URL, continue
        if (!media.poster_path || media.poster_path.startsWith('http')) continue;
        
        // Otherwise fetch a better poster image
        try {
          const title = isMovie(media) ? media.title : (media as any).name || 'Unknown';
          const releaseYear = isMovie(media) 
            ? (media.release_date ? new Date(media.release_date).getFullYear().toString() : "Unknown")
            : (isTVShow(media) && media.first_air_date 
                ? new Date(media.first_air_date).getFullYear().toString() 
                : "Unknown");
          
          const posterUrl = await fetchPosterImage(
            title,
            releaseYear !== "Unknown" ? releaseYear : undefined,
            media.media_type === 'tv' ? 'tv' : 'movie'
          );
          
          if (posterUrl) {
            newPosterUrls[mediaKey] = posterUrl;
          }
        } catch (error) {
          console.error("Error fetching poster:", error);
        }
      }
      
      // Update state only if there are changes
      if (Object.keys(newPosterUrls).length > Object.keys(posterUrls).length) {
        setPosterUrls(newPosterUrls);
      }
    };
    
    if (results.length > 0) {
      fetchPosters();
    }
  }, [results, posterUrls]);

  const playMediaDirectlyById = () => {
    if (isShowContent) {
      if (!showId.trim()) {
        alert("Please enter a valid show ID");
        return;
      }
      
      // Create a minimal TV show object with the ID, season and episode for the player
      const directTVShow: TVShow = {
        id: showId,
        name: `TV Show ID: ${showId}`,
        overview: "",
        poster_path: null,
        first_air_date: "",
        vote_average: 0,
        media_type: 'tv',
        selected_season: parseInt(showSeason),
        selected_episode: parseInt(showEpisode)
      };
      
      // Add the ID to the appropriate field based on selected type
      if (showIdType === 'imdb') {
        directTVShow.imdb_id = showId;
      } else {
        directTVShow.tmdb_id = Number(showId);
      }
      
      // Pass the TV show object to the player
      onMovieSelect(directTVShow);
      setShowId("");
      setShowSeason("1");
      setShowEpisode("1");
      setShowIdSearch(false);
    } else {
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
    }
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

  const handleSelect = async (media: Media) => {
    console.log("Selected media:", {
      id: media.id,
      title: isMovie(media) ? media.title : (media as TVShow).name,
      type: media.media_type,
      imdb_id: media.imdb_id,
      tmdb_id: media.tmdb_id
    });
    
    // Start loading state
    setIsLoading(true);
    
    if (isTVShow(media)) {
      // For TV shows, try to get IMDb ID first if it's not available
      if (!media.imdb_id && !String(media.id).startsWith('tt')) {
        try {
          console.log("Pre-fetching IMDb ID for TV show");
          const tvShow = media as TVShow;
          const releaseYear = tvShow.first_air_date 
            ? new Date(tvShow.first_air_date).getFullYear().toString()
            : undefined;
          
          // Try to get IMDb ID directly
          const imdbId = await searchImdbAndExtractId(tvShow.name, releaseYear, 'tv');
          if (imdbId) {
            console.log(`Pre-fetched IMDb ID: ${imdbId} for ${tvShow.name}`);
            // Add the IMDb ID to the media object
            (tvShow as any).imdb_id = imdbId;
          } else {
            console.log(`Could not pre-fetch IMDb ID for ${tvShow.name}`);
          }
        } catch (error) {
          console.error("Error pre-fetching IMDb ID:", error);
        }
      }
      
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
    
    // End loading state
    setIsLoading(false);
  };

  const handleWatchTVShow = () => {
    if (selectedMedia) {
      // Log the TV show details for debugging
      console.log("Preparing TV show for player:", {
        id: selectedMedia.id,
        name: selectedMedia.name,
        imdb_id: selectedMedia.imdb_id,
        tmdb_id: selectedMedia.tmdb_id,
        season: selectedSeason,
        episode: selectedEpisode
      });
      
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

  // Helper to get the poster URL for a media item
  const getPosterUrl = (media: Media): string => {
    const mediaKey = `${media.id}-${media.media_type}`;
    return posterUrls[mediaKey] || getFullPosterPath(media.poster_path);
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
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-white">Content Type:</div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsShowContent(false)}
                className={`px-3 py-1 text-sm rounded-full ${!isShowContent ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
              >
                Movie
              </button>
              <button 
                onClick={() => setIsShowContent(true)}
                className={`px-3 py-1 text-sm rounded-full ${isShowContent ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
              >
                TV Show
              </button>
            </div>
          </div>

          {!isShowContent ? (
            // Movie ID UI
            <input
              type="text"
              placeholder="Enter movie ID"
              value={mediaId}
              onChange={(e) => setMediaId(e.target.value.trim())}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          ) : (
            // TV Show ID UI
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-gray-400">ID Type:</div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowIdType('imdb')}
                    className={`px-3 py-1 text-xs rounded-full ${showIdType === 'imdb' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
                  >
                    IMDb ID
                  </button>
                  <button 
                    onClick={() => setShowIdType('tmdb')}
                    className={`px-3 py-1 text-xs rounded-full ${showIdType === 'tmdb' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
                  >
                    TMDB ID
                  </button>
                </div>
              </div>
              
              <input
                type="text"
                placeholder={`Enter ${showIdType === 'imdb' ? 'IMDb' : 'TMDB'} ID`}
                value={showId}
                onChange={(e) => setShowId(e.target.value.trim())}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs text-gray-400">Season</label>
                  <input
                    type="number"
                    placeholder="Season"
                    min="1"
                    value={showSeason}
                    onChange={(e) => setShowSeason(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs text-gray-400">Episode</label>
                  <input
                    type="number"
                    placeholder="Episode"
                    min="1"
                    value={showEpisode}
                    onChange={(e) => setShowEpisode(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {showIdType === 'imdb' 
                  ? "Example: tt1234567 (starts with 'tt')" 
                  : "Example: 1234 (numeric ID only)"}
              </p>
            </div>
          )}
          
          <button
            onClick={playMediaDirectlyById}
            disabled={!isShowContent ? !mediaId.trim() : !showId.trim()}
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
                    src={getPosterUrl(media)}
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
                <div className="flex-shrink-0 ml-2">
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