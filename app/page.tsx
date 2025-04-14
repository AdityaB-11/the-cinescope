"use client";

import { useState } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import Recommender from "./components/Recommender";
import MoviePlayer from "./components/MoviePlayer";
import { Movie } from "./types";

export default function Home() {
  const [mode, setMode] = useState<"search" | "recommend">("search");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedIdType, setSelectedIdType] = useState<'primary' | 'tmdb' | 'imdb'>('primary');

  const handleMovieSelect = (movie: Movie, idType?: 'tmdb' | 'imdb') => {
    setSelectedMovie(movie);
    setSelectedIdType(idType === 'tmdb' ? 'tmdb' : idType === 'imdb' ? 'imdb' : 'primary');
  };

  const handleClosePlayer = () => {
    setSelectedMovie(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header mode={mode} onModeChange={setMode} />
      
      <main className="flex-grow p-4 md:p-8">
        <div className="container mx-auto">
          {mode === "search" ? (
            <div className="py-8">
              <h1 className="text-3xl font-bold mb-8 text-center">
                Find and Watch Your Favorite Movies
              </h1>
              <SearchBar onMovieSelect={handleMovieSelect} />
            </div>
          ) : (
            <div className="py-8">
              <h1 className="text-3xl font-bold mb-8 text-center">
                Get Personalized Movie Recommendations
              </h1>
              <Recommender onMovieSelect={handleMovieSelect} />
            </div>
          )}
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Made with ❤️ by <a href="https://github.com/AdityaB-11" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">AdityaB-11</a></p>
        </div>
      </footer>

      {selectedMovie && (
        <MoviePlayer 
          movie={selectedMovie} 
          onClose={handleClosePlayer} 
          initialIdType={selectedIdType}
        />
      )}
    </div>
  );
}
