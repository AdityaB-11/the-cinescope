"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus({ 
        success: true, 
        message: "Thank you for your message! We'll get back to you soon." 
      });
      
      // Reset form
      setFormData({ name: "", email: "", message: "" });
      
      // Clear status after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 1500);
  };

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
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-8 gradient-text">Contact Us</h1>
          
          <div className="bg-card-bg rounded-lg p-6 shadow-lg mb-8">
            <p className="text-gray-300 mb-6">
              Have questions, feedback, or just want to say hello? We'd love to hear from you!
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
            
            {submitStatus && (
              <div className={`p-4 mb-6 rounded-lg ${submitStatus.success ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                {submitStatus.message}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="neon-button py-2 px-6 rounded-full font-medium w-full"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
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