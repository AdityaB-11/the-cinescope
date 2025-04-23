"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  mode: "search" | "recommend";
  onModeChange: (mode: "search" | "recommend") => void;
}

export default function Header({ mode, onModeChange }: HeaderProps) {
  useEffect(() => {
    // Listen for the custom event to change mode
    const handleModeChange = (event: CustomEvent<"search" | "recommend">) => {
      onModeChange(event.detail);
    };

    window.addEventListener('changeMode', handleModeChange as EventListener);

    return () => {
      window.removeEventListener('changeMode', handleModeChange as EventListener);
    };
  }, [onModeChange]);

  const handleModeSwitch = (newMode: "search" | "recommend") => {
    // Change the mode
    onModeChange(newMode);
    
    // Scroll to the appropriate section
    const sectionId = newMode === "search" ? "search" : "recommend";
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="w-full py-4 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between border-b border-gray-800 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <Link href="/" className="flex items-center mb-4 sm:mb-0 transition-transform duration-300 hover:scale-105">
        <Image
          src="/logo.png" 
          alt="LRLK Logo" 
          width={150} 
          height={50}
          className="h-10 w-auto" 
          priority
        />
      </Link>
      
      <div className="flex items-center space-x-4">
        <div className="flex space-x-1 md:space-x-2 bg-gray-900 p-1 rounded-full shadow-lg">
          <button
            onClick={() => handleModeSwitch("search")}
            className={`px-3 py-2 rounded-full text-sm md:text-base transition-all duration-300 ${
              mode === "search"
                ? "bg-primary text-white shadow-md"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Find Movies
          </button>
          <button
            onClick={() => handleModeSwitch("recommend")}
            className={`px-3 py-2 rounded-full text-sm md:text-base transition-all duration-300 ${
              mode === "recommend"
                ? "bg-accent text-background shadow-md"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Recommend
          </button>
        </div>
        
        <nav className="hidden sm:flex items-center space-x-4 ml-4">
          <Link href="/contact" className="text-gray-400 hover:text-accent transition-all duration-300 hover:scale-105">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
} 