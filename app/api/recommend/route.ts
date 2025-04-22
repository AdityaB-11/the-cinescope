import { NextResponse } from "next/server";
import { getMovieRecommendations } from "@/app/lib/gemini";

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

    const recommendations = await getMovieRecommendations(
      { 
        genre, 
        description,
        media_type
      }, 
      count
    );

    return NextResponse.json({ media: recommendations });
  } catch (error) {
    console.error("Error in recommend API:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
} 