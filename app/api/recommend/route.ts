import { NextResponse } from "next/server";
import { getMovieRecommendations, getTVShowRecommendations } from "@/app/lib/gemini";
import { fetchPosterImage } from "@/app/lib/api";
import { Media, isMovie, isTVShow } from "@/app/types";

// Helper function to extract year from date string
function extractYear(dateString: string): string | undefined {
  if (!dateString || dateString === "Unknown") return undefined;
  
  // Extract year from YYYY or YYYY-MM-DD format
  const match = dateString.match(/^(\d{4})/);
  return match ? match[1] : undefined;
}

// Helper function to fetch posters for recommendations
async function addPostersToRecommendations(recommendations: Media[]): Promise<Media[]> {
  // Create a copy of the recommendations to avoid mutating the original
  const recommendationsWithPosters = [...recommendations];
  
  // Fetch posters for each recommendation
  for (const media of recommendationsWithPosters) {
    const title = isMovie(media) ? media.title : (media as any).name;
    const releaseDate = isMovie(media) ? media.release_date : (media as any).first_air_date;
    const year = extractYear(releaseDate);
    const mediaType = isMovie(media) ? 'movie' : 'tv';
    
    // Only fetch a poster if we don't already have one
    if (!media.poster_path || media.poster_path === null) {
      const posterUrl = await fetchPosterImage(title, year, mediaType);
      if (posterUrl) {
        media.poster_path = posterUrl;
      }
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return recommendationsWithPosters;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { genre, description, count = 3, media_type = 'movie' } = body;
    
    if (!genre && !description) {
      return NextResponse.json(
        { error: "Genre or description is required" },
        { status: 400 }
      );
    }

    let recommendations: Media[] = [];
    
    if (media_type === 'tv') {
      // TV show recommendations
      recommendations = await getTVShowRecommendations(
        { 
          genre, 
          description,
          media_type
        }, 
        count
      );
    } else {
      // Movie recommendations (default)
      recommendations = await getMovieRecommendations(
        { 
          genre, 
          description,
          media_type
        }, 
        count
      );
    }
    
    // Add posters to the recommendations
    const recommendationsWithPosters = await addPostersToRecommendations(recommendations);
    
    return NextResponse.json({ media: recommendationsWithPosters });
  } catch (error) {
    console.error("Error in recommend API:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
} 