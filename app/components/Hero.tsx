"use client";

import Link from 'next/link';

export default function Hero() {
  const handleModeChange = (mode: "search" | "recommend") => {
    // Find the section by id and scroll to it
    const sectionId = mode === "search" ? "search" : "recommend";
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Also programmatically trigger mode change
    const event = new CustomEvent('changeMode', { detail: mode });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative overflow-hidden mb-12">
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background"></div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,180,255,0.15),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(123,104,238,0.15),transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text transition-all duration-500 hover:scale-105">
            Discover Your Next Cinematic Experience
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-10 transition-opacity duration-300">
            Find, watch, and get personalized recommendations for the best movies and shows all in one place
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button 
              onClick={() => handleModeChange("search")}
              className="neon-button py-3 px-8 rounded-full font-medium text-lg transition-all duration-300"
            >
              Find Movies/Shows
            </button>
            <button 
              onClick={() => handleModeChange("recommend")}
              className="bg-primary hover:bg-primary/90 text-white py-3 px-8 rounded-full font-medium text-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(123,104,238,0.5)]"
            >
              Get Recommendations
            </button>
          </div>
          
          {/* Animated circles */}
          <div className="relative h-40 md:h-60 mt-8">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-accent/30 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-primary/40 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
} 