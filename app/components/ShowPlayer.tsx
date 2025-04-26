"use client";

import { useState, useEffect, useRef } from "react";
import { TVShow } from "../types";
import { getVidFastTVEmbedUrl, searchImdbAndExtractId } from "../lib/api";

interface ShowPlayerProps {
  show: TVShow;
  onClose: () => void;
  initialIdType?: 'tmdb' | 'imdb';
}

export default function ShowPlayer({ show, onClose, initialIdType = 'imdb' }: ShowPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentIdType, setCurrentIdType] = useState<'tmdb' | 'imdb'>(initialIdType);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [alternativeIdType, setAlternativeIdType] = useState<'tmdb' | null>(null);
  const [isScrapingImdb, setIsScrapingImdb] = useState(false);
  const [imdbIdFound, setImdbIdFound] = useState(!!show.imdb_id);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  
  // Season and episode selection
  const [selectedSeason, setSelectedSeason] = useState(show.selected_season || 1);
  const [selectedEpisode, setSelectedEpisode] = useState(show.selected_episode || 1);
  const [episodesPerSeason, setEpisodesPerSeason] = useState<{[key: number]: number}>({});
  const [totalSeasons, setTotalSeasons] = useState(show.number_of_seasons || 1);
  
  // Effect to set up seasons data
  useEffect(() => {
    // Use episodes_per_season from the show if available, otherwise use defaults
    if (show.episodes_per_season) {
      const episodesMap: {[key: number]: number} = {};
      // Convert string keys to numbers
      Object.entries(show.episodes_per_season).forEach(([season, count]) => {
        episodesMap[parseInt(season)] = count;
      });
      setEpisodesPerSeason(episodesMap);
    } else {
      // Default to a reasonable number of episodes per season if not provided
      const defaultEpisodesPerSeason: {[key: number]: number} = {};
      for (let i = 1; i <= (show.number_of_seasons || 1); i++) {
        defaultEpisodesPerSeason[i] = 10; // Default to 10 episodes per season
      }
      setEpisodesPerSeason(defaultEpisodesPerSeason);
    }
    setTotalSeasons(show.number_of_seasons || 1);
  }, [show]);
  
  // Effect to determine the proper ID type and embed URL
  useEffect(() => {
    updateEmbedUrl();
  }, [show.imdb_id, show.tmdb_id, selectedSeason, selectedEpisode]);
  
  // Update embed URL based on current selections
  const updateEmbedUrl = () => {
    if (show.imdb_id) {
      setCurrentIdType('imdb');
      setEmbedUrl(getVidFastTVEmbedUrl(show.imdb_id, selectedSeason, selectedEpisode));
      setImdbIdFound(true);
    } else if (show.tmdb_id) {
      setCurrentIdType('tmdb');
      setEmbedUrl(getVidFastTVEmbedUrl(show.tmdb_id, selectedSeason, selectedEpisode));
    } else if (show.id) {
      // Handle case where we only have an ID without explicit type
      // Try to detect if it's an IMDb ID (typically starts with 'tt')
      const idString = String(show.id);
      if (idString.startsWith('tt')) {
        setCurrentIdType('imdb');
        // Treat show.id as imdb_id for direct play
        (show as any).imdb_id = idString;
        setEmbedUrl(getVidFastTVEmbedUrl(idString, selectedSeason, selectedEpisode));
        setImdbIdFound(true);
      } else {
        // Otherwise assume it's a TMDB ID
        setCurrentIdType('tmdb');
        // Treat show.id as tmdb_id for direct play
        (show as any).tmdb_id = Number(idString) || idString;
        setEmbedUrl(getVidFastTVEmbedUrl(idString, selectedSeason, selectedEpisode));
      }
    } else {
      setEmbedUrl('');
    }
  };
  
  // Try to get IMDb ID if not available - this is now a critical step
  useEffect(() => {
    const fetchImdbId = async () => {
      // Skip fetching if we already have a direct ID in show.id, show.imdb_id, or show.tmdb_id
      if ((show.id && String(show.id).startsWith('tt')) || show.imdb_id || show.tmdb_id) {
        // We already have an ID we can use, no need to search
        setIsScrapingImdb(false);
        setIsLoading(false);
        return;
      }
      
      // Only try to fetch if we don't have any usable ID and show has a name
      if (!show.imdb_id && !show.tmdb_id && show.name) {
        try {
          setIsScrapingImdb(true);
          setIsLoading(true);
          
          // Extract release year from first_air_date if available
          const releaseYear = show.first_air_date && typeof show.first_air_date === 'string' 
            ? show.first_air_date.substring(0, 4) 
            : undefined;
          
          const imdbId = await searchImdbAndExtractId(show.name, releaseYear, 'tv');
          
          if (imdbId) {
            // Since we can't directly modify the show prop, we need to add the ID to the show object in memory
            (show as any).imdb_id = imdbId;
            setImdbIdFound(true);
            console.log(`Found IMDb ID: ${imdbId} for ${show.name}`);
            
            // Update the embed URL now that we have the IMDb ID
            updateEmbedUrl();
          } else {
            // If no IMDb ID found, show error immediately
            setHasError(true);
            console.error(`No IMDb ID found for ${show.name}`);
          }
        } catch (error) {
          console.error("Error fetching IMDb ID:", error);
          setHasError(true);
        } finally {
          setIsScrapingImdb(false);
          setIsLoading(false);
        }
      }
    };

    fetchImdbId();
  }, [show]);
  
  // Get the appropriate embed URL based on ID type, show ID, season, and episode
  const getVidFastTVEmbedUrl = (id: string | number, season: number, episode: number): string => {
    return `https://vidfast.pro/tv/${id}/${season}/${episode}?autoPlay=true`;
  };
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    
    // If using IMDb ID and it failed, and we have TMDB ID, offer to try that
    if (currentIdType === 'imdb' && show.tmdb_id) {
      setAlternativeIdType('tmdb');
      setShowConfirmDialog(true);
      return;
    } else if (currentIdType === 'tmdb' && (show.imdb_id || (show.id && String(show.id).startsWith('tt')))) {
      // If TMDB failed and we have or can detect an IMDb ID, try that
      const imdbId = show.imdb_id || String(show.id);
      setCurrentIdType('imdb');
      setIsLoading(true);
      
      // Update embed URL
      const newUrl = getVidFastTVEmbedUrl(imdbId, selectedSeason, selectedEpisode);
      setEmbedUrl(newUrl);
      
      if (iframeRef.current) {
        iframeRef.current.src = newUrl;
      }
      return;
    }
    
    // If all attempts failed, show error
    setHasError(true);
  };

  // Function to handle confirmation of alternative ID
  const handleConfirmAlternativeId = () => {
    if (alternativeIdType && alternativeIdType === 'tmdb' && show.tmdb_id) {
      setCurrentIdType('tmdb');
      setIsLoading(true);
      setShowConfirmDialog(false);
      
      // Update embed URL
      const newUrl = getVidFastTVEmbedUrl(show.tmdb_id, selectedSeason, selectedEpisode);
      setEmbedUrl(newUrl);
      
      // Force iframe refresh with new URL
      if (iframeRef.current) {
        iframeRef.current.src = newUrl;
      }
    }
  };

  // Function to reject alternative ID
  const handleRejectAlternativeId = () => {
    setShowConfirmDialog(false);
    setHasError(true);
  };

  // Handle season change
  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(1); // Reset to episode 1 when changing seasons
    setIsLoading(true);
  };
  
  // Handle episode change
  const handleEpisodeChange = (episode: number) => {
    setSelectedEpisode(episode);
    setIsLoading(true);
  };

  // Retry function
  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    
    // Try to re-fetch the IMDb ID
    if (!show.imdb_id && show.name) {
      const fetchImdbId = async () => {
        try {
          setIsScrapingImdb(true);
          
          // Extract release year from first_air_date if available
          const releaseYear = show.first_air_date && typeof show.first_air_date === 'string' 
            ? show.first_air_date.substring(0, 4) 
            : undefined;
          
          const imdbId = await searchImdbAndExtractId(show.name, releaseYear, 'tv');
          
          if (imdbId) {
            (show as any).imdb_id = imdbId;
            setImdbIdFound(true);
            setCurrentIdType('imdb');
            
            // Update embed URL
            const newUrl = getVidFastTVEmbedUrl(imdbId, selectedSeason, selectedEpisode);
            setEmbedUrl(newUrl);
            
            // Refresh iframe with new IMDb ID
            if (iframeRef.current) {
              iframeRef.current.src = newUrl;
            }
          } else {
            setHasError(true);
          }
        } catch (error) {
          console.error("Error fetching IMDb ID:", error);
          setHasError(true);
        } finally {
          setIsScrapingImdb(false);
        }
      };
      
      fetchImdbId();
    } else if (show.imdb_id) {
      // We already have an IMDb ID, try again with it
      setCurrentIdType('imdb');
      
      // Update embed URL
      const newUrl = getVidFastTVEmbedUrl(show.imdb_id, selectedSeason, selectedEpisode);
      setEmbedUrl(newUrl);
      
      if (iframeRef.current) {
        iframeRef.current.src = newUrl;
      }
    } else {
      // No IMDb ID and no title to search with
      setHasError(true);
    }
  };

  // Get the display text for current ID type
  const getIdTypeText = () => {
    return currentIdType === 'imdb' ? 'IMDb ID' : 'TMDB ID';
  };
  
  // Get the current ID value
  const getCurrentId = () => {
    return currentIdType === 'imdb' ? show.imdb_id : show.tmdb_id;
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
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-card-bg rounded-lg overflow-hidden shadow-xl">
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <div>
            <h3 className="text-xl font-medium">{show.name}</h3>
            <p className="text-sm text-gray-400">
              {getIdTypeText()}: {getCurrentId()}
              {isScrapingImdb && (
                <span className="ml-2 text-blue-400 text-xs animate-pulse">
                  Looking for IMDb ID...
                </span>
              )}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              {show.tmdb_id && currentIdType !== 'tmdb' && <span className="mr-2">TMDB: {show.tmdb_id}</span>}
              {show.imdb_id && currentIdType !== 'imdb' && <span className="mr-2">IMDb: {show.imdb_id}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        {/* Season and Episode Selector */}
        <div className="p-3 bg-gray-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <select
              value={selectedSeason}
              onChange={(e) => handleSeasonChange(Number(e.target.value))}
              className="bg-gray-700 text-white rounded px-2 py-1 text-sm min-w-[120px]"
            >
              {renderSeasonOptions()}
            </select>
          </div>
          
          <div className="flex items-center">
            <select
              value={selectedEpisode}
              onChange={(e) => handleEpisodeChange(Number(e.target.value))}
              className="bg-gray-700 text-white rounded px-2 py-1 text-sm min-w-[120px]"
            >
              {renderEpisodeOptions()}
            </select>
          </div>
          
          <div className="flex-grow"></div>
          
          <div className="text-sm text-gray-300">
            S{selectedSeason}:E{selectedEpisode}
          </div>
        </div>
        
        <div className="relative w-full pt-[56.25%]">
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-300">
                  {isScrapingImdb ? 'Searching for IMDb ID...' : 'Loading show player...'}
                </p>
              </div>
            </div>
          )}
          
          {showConfirmDialog && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/90 text-center p-6">
              <div className="bg-card-bg p-6 rounded-lg max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Playback Issue</h3>
                <p className="text-gray-300 mb-4">
                  The show couldn't be loaded with the IMDb ID. 
                  Would you like to try the TMDB ID instead?
                </p>
                <div className="flex space-x-3 justify-center">
                  <button 
                    onClick={handleConfirmAlternativeId}
                    className="neon-button py-2 px-6 rounded-full text-sm font-medium"
                  >
                    Yes, Try TMDB ID
                  </button>
                  <button 
                    onClick={handleRejectAlternativeId}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-full text-sm font-medium"
                  >
                    No, Show Error
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black text-center p-6">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Playback Error</h3>
                <p className="text-gray-300 mb-4">
                  {show.imdb_id 
                    ? 'Sorry, we tried using the IMDb ID but playback failed. This show may be unavailable.'
                    : 'Sorry, we couldn\'t find a valid IMDb ID for this show. Playback is unavailable.'}
                </p>
                <button 
                  onClick={handleRetry}
                  className="neon-button py-2 px-6 rounded-full text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          
          {!isLoading && !hasError && embedUrl && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="encrypted-media"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          ></iframe>
          )}
        </div>
      </div>
    </div>
  );
} 