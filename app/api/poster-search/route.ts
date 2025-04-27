import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// We'll use this function to attempt to find a poster image for a movie or TV show
export async function GET(request: Request) {
  // Extract query parameters
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
    // Use Gemini to help us construct a search query that's likely to find poster images
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create a search query that's specific to finding poster images
    const prompt = `I need to find a poster image URL for "${title}" ${year ? `(${year})` : ""} ${mediaType === "tv" ? "TV show" : "movie"}.
    Please provide me with a direct image URL that shows the official poster of this ${mediaType === "tv" ? "TV show" : "movie"}.
    The image should be:
    - A high quality poster or cover art
    - In portrait orientation (taller than it is wide)
    - From a reputable source (like IMDb, Wikipedia, official websites)
    
    Reply with ONLY the direct image URL and nothing else. If you can't find one with high confidence, respond with "No poster found".`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    // Check if we got a valid URL response
    if (response.startsWith("http") && (response.includes(".jpg") || response.includes(".png") || response.includes(".jpeg") || response.includes("image"))) {
      // Validate that the URL actually returns an image
      try {
        const imageResponse = await fetch(response, { method: 'HEAD' });
        const contentType = imageResponse.headers.get('content-type');
        
        if (contentType && contentType.startsWith('image/')) {
          return NextResponse.json({ posterUrl: response });
        }
      } catch (error) {
        console.error("Error validating image URL:", error);
      }
    }
    
    // If we're here, either the AI didn't find a good URL or the URL validation failed
    // As a fallback, let's try a second approach with a different model
    const fallbackPrompt = `Find the official poster image URL for "${title}" ${year ? `(${year})` : ""} ${mediaType === "tv" ? "TV show" : "movie"}.
    Return only a direct image URL, nothing else.`;
    
    const fallbackResult = await model.generateContent(fallbackPrompt);
    const fallbackResponse = fallbackResult.response.text().trim();
    
    if (fallbackResponse.startsWith("http") && (fallbackResponse.includes(".jpg") || fallbackResponse.includes(".png") || fallbackResponse.includes(".jpeg") || fallbackResponse.includes("image"))) {
      return NextResponse.json({ posterUrl: fallbackResponse });
    }
    
    // If all attempts failed, return that no poster was found
    return NextResponse.json({ posterUrl: null });
    
  } catch (error) {
    console.error("Error searching for poster:", error);
    return NextResponse.json(
      { error: "Failed to search for poster" },
      { status: 500 }
    );
  }
} 