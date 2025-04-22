import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  
  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }
  
  try {
    // Use the title to search IMDb
    const imdbSearchUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(query)}`;
    
    // Using fetch to get the IMDb search page
    const response = await fetch(imdbSearchUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch IMDb search results');
    }
    
    const html = await response.text();
    
    // Extract the first movie result URL
    const matchResult = html.match(/\/title\/(tt\d+)\//);
    const imdbId = matchResult && matchResult[1] ? matchResult[1] : null;
    
    if (imdbId) {
      return NextResponse.json({ imdbId });
    } else {
      return NextResponse.json({ error: "No IMDb ID found" }, { status: 404 });
    }
  } catch (error) {
    console.error('Error searching IMDb:', error);
    return NextResponse.json(
      { error: "Failed to search IMDb" },
      { status: 500 }
    );
  }
} 