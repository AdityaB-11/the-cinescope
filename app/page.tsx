"use client";

import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import Recommender from "./components/Recommender";
import MoviePlayer from "./components/MoviePlayer";
import ShowPlayer from "./components/ShowPlayer";
import Hero from "./components/Hero";
import ComingSoon from "./components/ComingSoon";
import { Media, Movie, TVShow, isMovie, isTVShow } from "./types";

export default function Home() {
  const [mode, setMode] = useState<"search" | "recommend">("search");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevModeRef = useRef<"search" | "recommend">("search");

  useEffect(() => {
    // Listen for the custom event to change mode
    const handleModeChange = (event: CustomEvent<"search" | "recommend">) => {
      setMode(event.detail);
    };

    window.addEventListener('changeMode', handleModeChange as EventListener);

    return () => {
      window.removeEventListener('changeMode', handleModeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    // If the mode has changed, handle the transition
    if (prevModeRef.current !== mode) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300); // Match this to your transition duration

      prevModeRef.current = mode;
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleMediaSelect = (media: Media) => {
    setSelectedMedia(media);
  };

  const handleClosePlayer = () => {
    setSelectedMedia(null);
  };

  // Render the appropriate player component based on media type
  const renderMediaPlayer = () => {
    if (!selectedMedia) return null;
    
    if (isMovie(selectedMedia)) {
      return (
        <MoviePlayer 
          movie={selectedMedia as Movie} 
          onClose={handleClosePlayer}
          initialIdType="imdb"
        />
      );
    } else if (isTVShow(selectedMedia)) {
      return (
        <ShowPlayer 
          show={selectedMedia as TVShow} 
          onClose={handleClosePlayer}
          initialIdType="imdb"
        />
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header mode={mode} onModeChange={setMode} />
      
      <main className="flex-grow">
        <Hero />
        
        <div className="container mx-auto px-4">
          {/* We'll use CSS transitions for smooth mode switching */}
          <div 
            className={`transition-all duration-300 ${
              mode === "search" ? "block opacity-100" : "hidden opacity-0"
            }`} 
            id="search"
          >
            <div className="py-8 fade-in">
              <h1 className="text-3xl font-bold mb-8 text-center gradient-text">
                Find and Watch Movies & TV Shows
              </h1>
              <SearchBar onMovieSelect={handleMediaSelect} />
            </div>
          </div>
          
          <div 
            className={`transition-all duration-300 ${
              mode === "recommend" ? "block opacity-100" : "hidden opacity-0"
            }`} 
            id="recommend"
          >
            <div className="py-8 fade-in">
              <h1 className="text-3xl font-bold mb-8 text-center gradient-text">
                Get Personalized Content Recommendations
              </h1>
              <Recommender onMovieSelect={handleMediaSelect} />
            </div>
          </div>
        </div>
        
        <ComingSoon />
      </main>
      
      <footer className="py-6 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© 2025 The Cinescope. All rights reserved.</p>
          <div className="mt-4 flex justify-center space-x-6">
            <a href="https://github.com/AdityaB-11" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-accent transition-colors duration-300">
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="mailto:contact.adityab11@gmail.com" className="text-gray-400 hover:text-accent transition-colors duration-300">
              <span className="sr-only">Email</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>

      {renderMediaPlayer()}
    </div>
  );
}
