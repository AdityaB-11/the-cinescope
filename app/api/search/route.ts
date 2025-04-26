import { NextResponse } from "next/server";
import { searchAllMedia, searchMovies, searchTVShows } from "@/app/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const mediaType = searchParams.get("media_type") || "all";
  
  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }
  
  try {
    let media = [];
    
    // Search based on media type
    if (mediaType === "movies" || mediaType === "movie") {
      media = await searchMovies(query);
    } else if (mediaType === "tv") {
      media = await searchTVShows(query);
    } else {
      // Default to searching all media types
      media = await searchAllMedia(query);
    }
    
    return NextResponse.json({ 
      results: media,
      total_results: media.length 
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search media" },
      { status: 500 }
    );
  }
} 