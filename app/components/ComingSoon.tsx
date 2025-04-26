"use client";

import Image from 'next/image';

export default function ComingSoon() {
  const features = [
    {
      id: 2,
      title: "Anime",
      description: "Explore a vast collection of anime series and movies with personalized recommendations.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
    // Add more upcoming features here
  ];

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text transition-all duration-500 hover:scale-105">Coming Soon</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto transition-opacity duration-300">
            We're constantly working to bring you more content. Here's what's coming next:
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 max-w-lg mx-auto">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="relative bg-card-bg p-8 rounded-xl border border-gray-800 transition-all duration-500 hover:border-accent/50 hover:shadow-[0_0_15px_rgba(0,180,255,0.15)] group transform hover:-translate-y-2"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 transition-transform duration-500 transform group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-400 transition-colors duration-300 group-hover:text-gray-300">{feature.description}</p>
                
                <div className="mt-8 inline-flex items-center text-accent group-hover:text-white transition-colors duration-300">
                  <span className="mr-2">Coming soon</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 