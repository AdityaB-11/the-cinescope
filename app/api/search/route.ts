import { NextResponse } from "next/server";
import { searchMovies, searchTVShows, searchAllMedia, fetchPosterImage } from "@/app/lib/api";
import { Media, isMovie, isTVShow } from "@/app/types";

// Helper function to extract year from date string
function extractYear(dateString: string): string | undefined {
  if (!dateString || dateString === "Unknown") return undefined;
  
  // Extract year from YYYY or YYYY-MM-DD format
  const match = dateString.match(/^(\d{4})/);
  return match ? match[1] : undefined;
}

// Helper function to fetch posters for search results
async function addPostersToResults(results: Media[]): Promise<Media[]> {
  // Create a copy of the results to avoid mutating the original
  const resultsWithPosters = [...results];
  
  // Process in batches to avoid overwhelming the server with requests
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < resultsWithPosters.length; i += BATCH_SIZE) {
    const batch = resultsWithPosters.slice(i, i + BATCH_SIZE);
    
    // Create an array of promises for each item in the batch
    const posterPromises = batch.map(async (media) => {
      const title = isMovie(media) ? media.title : (media as any).name;
      const releaseDate = isMovie(media) ? media.release_date : (media as any).first_air_date;
      const year = extractYear(releaseDate);
      const mediaType = isMovie(media) ? 'movie' : 'tv';
      
      // Only fetch a poster if we don't already have one
      if (!media.poster_path || media.poster_path === null) {
        const posterUrl = await fetchPosterImage(title, year, mediaType);
        if (posterUrl) {
          return posterUrl;
        }
      }
      
      return null;
    });
    
    // Wait for all poster requests in this batch to complete
    const posters = await Promise.all(posterPromises);
    
    // Update the results with the posters
    for (let j = 0; j < batch.length; j++) {
      const posterUrl = posters[j];
      if (posterUrl) {
        batch[j].poster_path = posterUrl;
      }
    }
    
    // If this isn't the last batch, add a small delay to avoid rate limiting
    if (i + BATCH_SIZE < resultsWithPosters.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return resultsWithPosters;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const mediaType = searchParams.get("media_type") || "all";
  
  console.log(`API search request received: Query="${query}", Type=${mediaType}`);
  
  if (!query) {
    console.log("Rejecting request - query parameter missing");
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }
  
  try {
    let results: Media[] = [];
    
    // Search based on media type
    if (mediaType === "movies" || mediaType === "movie") {
      console.log(`Searching for movies with query "${query}"`);
      results = await searchMovies(query);
      console.log(`Found ${results.length} movie results`);
    } else if (mediaType === "tv") {
      console.log(`Searching for TV shows with query "${query}"`);
      results = await searchTVShows(query);
      console.log(`Found ${results.length} TV show results`);
    } else {
      // Default to searching all media types
      console.log(`Searching all media with query "${query}"`);
      results = await searchAllMedia(query);
      console.log(`Found ${results.length} combined results`);
    }
    
    // Add posters to the results
    console.log(`Adding posters to ${results.length} search results`);
    try {
      const resultsWithPosters = await addPostersToResults(results);
      console.log(`Successfully processed posters for ${resultsWithPosters.length} results`);
      
      return NextResponse.json({ 
        results: resultsWithPosters,
        total_results: resultsWithPosters.length 
      });
    } catch (posterError) {
      console.error("Error adding posters:", posterError);
      // Still return results even if poster fetching fails
      return NextResponse.json({ 
        results: results,
        total_results: results.length 
      });
    }
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search media", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 