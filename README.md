# LRLK Movie App

A modern movie discovery and streaming application with AI-powered recommendations and flexible playback options.

## Features

- **Search Movies**: Find movies by title with real-time results
- **Direct Playback**: Enter TMDB or IMDb IDs to play specific movies
- **Fallback System**: Automatically tries alternative IDs if primary ID fails
- **AI Recommendations**: Get personalized movie recommendations based on genre or description
- **Year Filtering**: Filter recommendations by release year range
- **Multiple Player Options**: Play via TMDB or IMDb IDs with dedicated buttons

## Technology Stack

- **Next.js 15+**: React framework with App Router
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: For responsive, modern UI
- **Google Gemini AI**: For intelligent movie recommendations and search
- **VidFast API**: For movie streaming

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Google Gemini API key

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/AdityaB-11/lere-lundke-movie-app.git
   cd lere-lundke-movie-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create an `.env.local` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set the environment variable for your Gemini API key
4. Deploy!

## License

MIT
