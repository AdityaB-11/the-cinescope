import Link from "next/link";
import Image from "next/image";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 px-4 md:px-6 flex items-center justify-between border-b border-gray-800">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png" 
            alt="LRLK Logo" 
            width={150} 
            height={50}
            className="h-10 w-auto" 
            priority
          />
        </Link>
      </header>
      
      <main className="flex-grow p-4 md:p-8">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-8 gradient-text">About LRLK</h1>
          
          <div className="bg-card-bg rounded-lg p-6 shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-300 mb-4">
              LRLK is a modern movie discovery platform designed to help you find and enjoy the best films from around the world. 
              Our mission is to make movie discovery intuitive, personalized, and enjoyable.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">How It Works</h2>
            <p className="text-gray-300 mb-4">
              Our platform uses advanced AI technology from Google Gemini to provide intelligent movie recommendations
              based on your preferences. Whether you're looking for a specific genre or have a particular mood in mind,
              our recommendation engine will help you discover movies you'll love.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Features</h2>
            <ul className="list-disc pl-5 text-gray-300 space-y-2">
              <li>AI-powered movie search with instant results</li>
              <li>Personalized recommendations based on genres or descriptions</li>
              <li>Integrated video player for seamless watching experience</li>
              <li>Clean, modern, and responsive design</li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <Link 
              href="/" 
              className="neon-button py-2 px-6 rounded-full text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Made with ❤️ by <a href="https://github.com/AdityaB-11" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">AdityaB-11</a></p>
        </div>
      </footer>
    </div>
  );
} 