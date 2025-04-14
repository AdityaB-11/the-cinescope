import { NextResponse } from "next/server";
import { getMovieRecommendations } from "@/app/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.genre && !body.description) {
      return NextResponse.json(
        { error: "Either genre or description is required" },
        { status: 400 }
      );
    }
    
    const count = body.count || 3;
    const recommendations = await getMovieRecommendations(
      {
        genre: body.genre,
        description: body.description,
      },
      count
    );
    
    return NextResponse.json({ movies: recommendations });
  } catch (error) {
    console.error("Error in recommendations API:", error);
    return NextResponse.json(
      { error: "Failed to get movie recommendations" },
      { status: 500 }
    );
  }
} 