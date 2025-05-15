import { NextResponse } from "next/server";

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || "3e1dd316d2c8fd7b6a0557604072c685"; // Using a public demo key for now
const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER_IMAGE = "/placeholder-poster.svg";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title");
  const year = url.searchParams.get("year");
  const mediaType = url.searchParams.get("media_type") || "movie";
  
  if (!title) {
    return NextResponse.json(
      { error: "Title parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Create a search query with the title and optional year
    let query = title;
    if (year) {
      query += ` ${year}`;
    }
    
    // Search for the movie or TV show using TMDB API
    const searchEndpoint = `${TMDB_API_BASE_URL}/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const searchResponse = await fetch(searchEndpoint);
    
    if (!searchResponse.ok) {
      throw new Error(`TMDB search failed: ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    
    // Check if we found any results
    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ posterUrl: null });
    }
    
    // Get the poster path from the first result
    const firstResult = searchData.results[0];
    const posterPath = firstResult.poster_path;
    
    if (!posterPath) {
      return NextResponse.json({ posterUrl: null });
    }
    
    // Build the full poster URL
    const posterUrl = `${TMDB_IMAGE_BASE_URL}${posterPath}`;
    
    return NextResponse.json({ posterUrl });
  } catch (error) {
    console.error("Error fetching poster from TMDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch poster" },
      { status: 500 }
    );
  }
} 