import { NextResponse } from "next/server";
import { getGenres } from "@/app/lib/api";

export function GET() {
  try {
    const genres = getGenres();
    return NextResponse.json({ genres });
  } catch (error) {
    console.error("Error in genres API:", error);
    return NextResponse.json(
      { error: "Failed to fetch genres" },
      { status: 500 }
    );
  }
} 