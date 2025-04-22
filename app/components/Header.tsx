"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  mode: "search" | "recommend";
  onModeChange: (mode: "search" | "recommend") => void;
}

export default function Header({ mode, onModeChange }: HeaderProps) {
  return (
    <header className="w-full py-4 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between border-b border-gray-800">
      <Link href="/" className="flex items-center mb-4 sm:mb-0">
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
        <div className="flex space-x-1 md:space-x-2 bg-gray-900 p-1 rounded-full">
          <button
            onClick={() => onModeChange("search")}
            className={`px-3 py-2 rounded-full text-sm md:text-base transition-all ${
              mode === "search"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Search
          </button>
          <button
            onClick={() => onModeChange("recommend")}
            className={`px-3 py-2 rounded-full text-sm md:text-base transition-all ${
              mode === "recommend"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Recommend
          </button>
        </div>
        
        <nav className="hidden sm:flex items-center space-x-4 ml-4">
          <Link href="/contact" className="text-gray-400 hover:text-accent transition-colors">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
} 