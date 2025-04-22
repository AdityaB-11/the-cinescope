import { NextResponse } from "next/server";
import { searchMovies } from "@/app/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  
  if (!query) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }
  
  try {
    const media = await searchMovies(query);
    return NextResponse.json({ results: media });
  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
} 