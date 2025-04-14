# LRLK - AI-Powered Movie Streaming Platform

A sleek, dark-themed movie streaming platform built with Next.js and Tailwind CSS, featuring AI-powered search, movie recommendations by Google's Gemini API, and embedded video player for watching movies.

## Features

1. **AI-Powered Search**
   - Real-time movie search with suggestions as you type
   - Search results show movie title, release year, and overview
   - Powered by Gemini AI

2. **Video Player**
   - Embedded video player using VidFast.pro
   - Clean, distraction-free viewing experience

3. **Movie Recommender**
   - Get personalized recommendations based on genre or description
   - Powered by Google's Gemini API for intelligent suggestions
   - Each recommendation includes title, release year, overview, and rating

4. **Modern UI**
   - Sleek dark theme with neon accents
   - Responsive design for all devices
   - Clean, intuitive user interface

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- Google Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AdityaB-11/lrlk.git
   cd lrlk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technologies Used

- Next.js 15
- Tailwind CSS 4
- TypeScript
- Google Gemini AI

## How It Works

1. **Search & Recommendations**: Instead of using traditional movie databases, this application leverages Google's Gemini AI model to search for movies and provide recommendations based on your input.

2. **Video Integration**: Movies can be watched through VidFast.pro's embedded player, referenced by unique numeric IDs.

## Disclaimer

This project is for educational purposes only. All content streamed through VidFast is assumed to be legally licensed.
