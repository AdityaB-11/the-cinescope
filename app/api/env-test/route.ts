import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({ 
    hasApiKey: !!apiKey,
    apiKeyFirstChars: apiKey ? `${apiKey.substring(0, 5)}...` : null,
    allEnvKeys: Object.keys(process.env).filter(key => 
      !key.startsWith('npm_') && 
      !key.startsWith('_')
    )
  });
} 