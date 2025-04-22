"use client";

import { useState, useEffect, useRef } from "react";
import { Movie } from "../types";
import { getVidFastEmbedUrl } from "../lib/api";

interface MoviePlayerProps {
  movie: Movie;
  onClose: () => void;
  initialIdType?: 'primary' | 'tmdb' | 'imdb';
}

export default function MoviePlayer({ movie, onClose, initialIdType = 'primary' }: MoviePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [usingFallbackId, setUsingFallbackId] = useState(false);
  const [currentIdType, setCurrentIdType] = useState<'primary' | 'tmdb' | 'imdb'>(initialIdType);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [alternativeIdType, setAlternativeIdType] = useState<'tmdb' | 'imdb' | null>(null);
  
  // Get the appropriate embed URL based on currentIdType
  const getEmbedUrl = () => {
    if (currentIdType === 'primary') {
      return getVidFastEmbedUrl(movie.id);
    } else if (currentIdType === 'tmdb' && movie.tmdb_id) {
      return getVidFastEmbedUrl(movie.tmdb_id);
    } else if (currentIdType === 'imdb' && movie.imdb_id) {
      return getVidFastEmbedUrl(movie.imdb_id);
    }
    // Fallback to primary if no alternatives
    return getVidFastEmbedUrl(movie.id);
  };
  
  const embedUrl = getEmbedUrl();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Reset state when movie changes or initialIdType changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setUsingFallbackId(initialIdType !== 'primary');
    setCurrentIdType(initialIdType);
  }, [movie.id, initialIdType]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    
    // Instead of automatically switching, check available alternatives and show confirmation dialog
    if (currentIdType === 'primary') {
      if (movie.tmdb_id) {
        setAlternativeIdType('tmdb');
        setShowConfirmDialog(true);
        return;
      } else if (movie.imdb_id) {
        setAlternativeIdType('imdb');
        setShowConfirmDialog(true);
        return;
      }
    } else if (currentIdType === 'tmdb' && movie.imdb_id) {
      setAlternativeIdType('imdb');
      setShowConfirmDialog(true);
      return;
    }
    
    // If we've tried all IDs or no alternative IDs exist, show error
    setHasError(true);
  };

  // Add function to handle confirmation
  const handleConfirmAlternativeId = () => {
    if (alternativeIdType) {
      setCurrentIdType(alternativeIdType);
      setIsLoading(true);
      setUsingFallbackId(true);
      setShowConfirmDialog(false);
    }
  };

  // Add function to reject alternative ID
  const handleRejectAlternativeId = () => {
    setShowConfirmDialog(false);
    setHasError(true);
  };

  // Restore the handleRetry function
  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    
    // Reset to primary ID for retry
    setCurrentIdType('primary');
    setUsingFallbackId(false);
    
    // Force iframe refresh
    if (iframeRef.current) {
      iframeRef.current.src = getVidFastEmbedUrl(movie.id);
    }
  };

  // Get the display text for current ID type
  const getIdTypeText = () => {
    switch (currentIdType) {
      case 'primary': return 'ID';
      case 'tmdb': return 'TMDB ID';
      case 'imdb': return 'IMDb ID';
      default: return 'ID';
    }
  };
  
  // Get the current ID value
  const getCurrentId = () => {
    switch (currentIdType) {
      case 'primary': return movie.id;
      case 'tmdb': return movie.tmdb_id;
      case 'imdb': return movie.imdb_id;
      default: return movie.id;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-card-bg rounded-lg overflow-hidden shadow-xl">
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <div>
            <h3 className="text-xl font-medium">{movie.title}</h3>
            <p className="text-sm text-gray-400">
              {getIdTypeText()}: {getCurrentId()}
              {usingFallbackId && (
                <span className="ml-2 text-yellow-400 text-xs">
                  (Using {currentIdType} ID)
                </span>
              )}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              {movie.id && currentIdType !== 'primary' && <span className="mr-2">ID: {movie.id}</span>}
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
                  {usingFallbackId ? 'Trying alternative ID...' : 'Loading movie player...'}
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
                  The movie couldn't be loaded with the current ID. 
                  Would you like to try the {alternativeIdType === 'tmdb' ? 'TMDB' : 'IMDb'} ID instead?
                </p>
                <div className="flex space-x-3 justify-center">
                  <button 
                    onClick={handleConfirmAlternativeId}
                    className="neon-button py-2 px-6 rounded-full text-sm font-medium"
                  >
                    Yes, Try Alternative
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
                  {usingFallbackId 
                    ? 'Sorry, we tried all available IDs but none worked. This movie may be unavailable.'
                    : 'Sorry, this movie couldn\'t be loaded. This may be due to an invalid ID or temporary service issues.'}
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