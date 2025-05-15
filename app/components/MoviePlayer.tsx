"use client";

import { useState, useEffect, useRef } from "react";
import { Movie } from "../types";
import { getVidFastEmbedUrl, searchImdbAndExtractId } from "../lib/api";

interface MoviePlayerProps {
  movie: Movie;
  onClose: () => void;
  initialIdType?: 'tmdb' | 'imdb';
}

export default function MoviePlayer({ movie, onClose, initialIdType = 'imdb' }: MoviePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentIdType, setCurrentIdType] = useState<'tmdb' | 'imdb'>(initialIdType);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [alternativeIdType, setAlternativeIdType] = useState<'tmdb' | null>(null);
  const [isScrapingImdb, setIsScrapingImdb] = useState(false);
  const [imdbIdFound, setImdbIdFound] = useState(!!movie.imdb_id);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  
  // Effect to determine the proper ID type and embed URL
  useEffect(() => {
    // Determine the best ID to use
    if (movie.imdb_id) {
      setCurrentIdType('imdb');
      setEmbedUrl(getVidFastEmbedUrl(movie.imdb_id));
    } else if (movie.tmdb_id) {
      setCurrentIdType('tmdb');
      setEmbedUrl(getVidFastEmbedUrl(movie.tmdb_id));
    } else {
      setEmbedUrl('');
    }
  }, [movie.imdb_id, movie.tmdb_id]);
  
  // Try to get IMDb ID if not available - this is now a critical step
  useEffect(() => {
    const fetchImdbId = async () => {
      // Only try to fetch if we don't already have an IMDb ID
      if (!movie.imdb_id && movie.title) {
        try {
          setIsScrapingImdb(true);
          setIsLoading(true);
          
          // Extract release year from release_date if available
          const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : undefined;
          
          const imdbId = await searchImdbAndExtractId(movie.title, releaseYear);
          
          if (imdbId) {
            // Since we can't directly modify the movie prop, we need to add the ID to the movie object in memory
            (movie as any).imdb_id = imdbId;
            setImdbIdFound(true);
            console.log(`Found IMDb ID: ${imdbId} for ${movie.title}`);
          } else {
            // If no IMDb ID found, show error immediately
            setHasError(true);
            console.error(`No IMDb ID found for ${movie.title}`);
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
  }, [movie]);
  
  // Get the appropriate embed URL based on currentIdType and available IDs
  // This is now just a helper function, not called during render
  const getEmbedUrl = (idType: 'imdb' | 'tmdb', id?: string | number): string => {
    if (!id) return '';
    return getVidFastEmbedUrl(id);
  };
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    
    // If using IMDb ID and it failed, and we have TMDB ID, offer to try that
    if (currentIdType === 'imdb' && movie.tmdb_id) {
      setAlternativeIdType('tmdb');
      setShowConfirmDialog(true);
      return;
    }
    
    // If all attempts failed, show error
    setHasError(true);
  };

  // Function to handle confirmation of alternative ID
  const handleConfirmAlternativeId = () => {
    if (alternativeIdType && alternativeIdType === 'tmdb' && movie.tmdb_id) {
      setCurrentIdType('tmdb');
      setIsLoading(true);
      setShowConfirmDialog(false);
      
      // Update embed URL
      const newUrl = getVidFastEmbedUrl(movie.tmdb_id);
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

  // Retry function
  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    
    // Try to re-fetch the IMDb ID
    if (!movie.imdb_id && movie.title) {
      const fetchImdbId = async () => {
        try {
          setIsScrapingImdb(true);
          
          // Extract release year from release_date if available
          const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : undefined;
          
          const imdbId = await searchImdbAndExtractId(movie.title, releaseYear);
          
          if (imdbId) {
            (movie as any).imdb_id = imdbId;
            setImdbIdFound(true);
            setCurrentIdType('imdb');
            
            // Update embed URL
            const newUrl = getVidFastEmbedUrl(imdbId);
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
    } else if (movie.imdb_id) {
      // We already have an IMDb ID, try again with it
      setCurrentIdType('imdb');
      
      // Update embed URL
      const newUrl = getVidFastEmbedUrl(movie.imdb_id);
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
    return currentIdType === 'imdb' ? movie.imdb_id : movie.tmdb_id;
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-card-bg rounded-lg overflow-hidden shadow-xl">
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <div>
            <h3 className="text-xl font-medium">{movie.title}</h3>
            <p className="text-sm text-gray-400">
              {getIdTypeText()}: {getCurrentId()}
              {isScrapingImdb && (
                <span className="ml-2 text-blue-400 text-xs animate-pulse">
                  Looking for IMDb ID...
                </span>
              )}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              {movie.tmdb_id && currentIdType !== 'tmdb' && <span className="mr-2">TMDB: {movie.tmdb_id}</span>}
              {movie.imdb_id && currentIdType !== 'imdb' && <span className="mr-2">IMDb: {movie.imdb_id}</span>}
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
                  {isScrapingImdb ? 'Searching for IMDb ID...' : 'Loading movie player...'}
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
                  The movie couldn't be loaded with the IMDb ID. 
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
                  {movie.imdb_id 
                    ? 'Sorry, we tried using the IMDb ID but playback failed. This movie may be unavailable.'
                    : 'Sorry, we couldn\'t find a valid IMDb ID for this movie. Playback is unavailable.'}
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