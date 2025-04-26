import { NextResponse } from "next/server";
import { searchImdbAndExtractId } from "../../lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  
  if (!title) {
    return NextResponse.json({ error: 'Title parameter is required' }, { status: 400 });
  }
  
  try {
    const imdbId = await searchImdbAndExtractId(title);
    
    return NextResponse.json({
      title,
      imdbId,
      status: imdbId ? 'success' : 'not_found'
    });
  } catch (error) {
    console.error('Error in IMDb test:', error);
    return NextResponse.json({ 
      error: 'Failed to get IMDb ID',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 