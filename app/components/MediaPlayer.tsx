"use client";

import { useState, useEffect, useRef } from "react";
import { Media, isMovie, isTVShow } from "../types";
import { getVidFastEmbedUrl, searchImdbAndExtractId } from "../lib/api";

interface MediaPlayerProps {
  media: Media;
  onClose: () => void;
}

export default function MediaPlayer({ media, onClose }: MediaPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [isImdbLoading, setIsImdbLoading] = useState(false);
  const [imdbError, setImdbError] = useState(false);
  
  // Get the embed URL based on media ID or IMDb ID if available
  const embedUrl = imdbId ? getVidFastEmbedUrl(imdbId) : getVidFastEmbedUrl(media.id);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Fetch IMDb ID when media changes
  useEffect(() => {
    // Only try to fetch IMDb ID for movie type
    if (isMovie(media) && !media.imdb_id) {
      setIsImdbLoading(true);
      setImdbError(false);
      
      const fetchImdbId = async () => {
        try {
          // Get the title correctly depending on media type
          const title = isMovie(media) 
            ? media.title 
            : (isTVShow(media) ? (media as any).name : "");
          // Use the searchImdbAndExtractId function to get IMDb ID
          const id = await searchImdbAndExtractId(title);
          if (id) {
            setImdbId(id);
          } else {
            setImdbError(true);
          }
        } catch (error) {
          console.error("Error fetching IMDb ID:", error);
          setImdbError(true);
        } finally {
          setIsImdbLoading(false);
        }
      };
      
      fetchImdbId();
    } else if (isMovie(media) && media.imdb_id) {
      // Use the IMDb ID from the media object if it exists
      setImdbId(media.imdb_id);
    }
  }, [media]);
  
  // Reset state when media changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [media.id, imdbId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Retry loading
  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    
    // Force iframe refresh
    if (iframeRef.current) {
      // If imdbId failed or isn't available, use original media.id
      const idToUse = imdbError || !imdbId ? media.id : imdbId;
      iframeRef.current.src = getVidFastEmbedUrl(idToUse);
    }
  };

  // Get the title based on media type
  const getTitle = () => {
    if (isMovie(media)) {
      return media.title;
    } else if (isTVShow(media)) {
      return (media as any).name;
    }
    return "Unknown Title";
  };

  // Get additional media info based on type
  const getMediaInfo = () => {
    if (isMovie(media)) {
      return (
        <>
          {media.release_date && (
            <span className="mr-3">Released: {media.release_date}</span>
          )}
          {media.runtime && (
            <span className="mr-3">Runtime: {media.runtime} min</span>
          )}
        </>
      );
    } else if (isTVShow(media)) {
      return (
        <>
          {media.first_air_date && (
            <span className="mr-3">First aired: {media.first_air_date}</span>
          )}
          {media.number_of_seasons && (
            <span className="mr-3">Seasons: {media.number_of_seasons}</span>
          )}
          {media.status && (
            <span className="mr-3">Status: {media.status}</span>
          )}
        </>
      );
    }
    return null;
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-card-bg rounded-lg overflow-hidden shadow-xl">
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <div>
            <div className="flex items-center">
              <h3 className="text-xl font-medium">{getTitle()}</h3>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-300 rounded">
                {isMovie(media) ? 'Movie' : 'TV Show'}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {imdbId ? (
                <>IMDb ID: {imdbId}</>
              ) : (
                <>ID: {media.id}</>
              )}
            </p>
            <div className="text-xs text-gray-400 mt-1">
              {getMediaInfo()}
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
        
        <div className="relative w-full pt-[56.25%]">
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-300">
                  {isImdbLoading ? 'Finding IMDb ID...' : 'Loading media player...'}
                </p>
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
                  Sorry, this {isMovie(media) ? 'movie' : 'show'} couldn't be loaded. This may be due to an invalid ID or temporary service issues.
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
        </div>
      </div>
    </div>
  );
} 