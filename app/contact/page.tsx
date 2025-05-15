"use client";

import { useState } from "react";
import Link from "next/link";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        return value.trim() === '' ? 'Name is required' : '';
      case 'email':
        if (value.trim() === '') return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'message':
        return value.trim() === '' ? 'Message is required' : 
               value.trim().length < 10 ? 'Message must be at least 10 characters' : '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate field on blur or if there's already an error
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: validateField(name, value)
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      message: validateField('message', formData.message)
    };
    
    setFormErrors(newErrors);
    
    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      setSubmitStatus({ 
        success: true, 
        message: data.message || "Thank you for your message! We'll get back to you soon." 
      });
      
      // Reset form on success
      setFormData({ name: "", email: "", message: "" });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : "Something went wrong. Please try again later." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 px-4 md:px-6 flex items-center justify-between border-b border-gray-800">
        <Link href="/" className="flex items-center transition-transform duration-300 hover:scale-105">
          <div className="flex items-center">
            <div className="relative">
              <div className="text-3xl font-bold tracking-tighter">
                <span className="text-white">The</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Cine</span>
                <span className="text-white">scope</span>
              </div>
              <div className="absolute -bottom-1 left-7 w-24 h-0.5 bg-gradient-to-r from-primary to-accent"></div>
              <div className="absolute -bottom-3 left-20 w-10 h-0.5 bg-accent opacity-60"></div>
            </div>
          </div>
        </Link>
        
        <div className="flex items-center space-x-4">
          <a 
            href="https://github.com/AdityaB-11" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-accent transition-all duration-300 hover:scale-110"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="sr-only">GitHub</span>
          </a>
          <a 
            href="mailto:contact.adityab11@gmail.com" 
            className="text-gray-400 hover:text-accent transition-all duration-300 hover:scale-110"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="sr-only">Email</span>
          </a>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-8">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-8 gradient-text transition-all duration-500 hover:scale-105">Contact Us</h1>
          
          <div className="bg-card-bg rounded-lg p-6 shadow-lg mb-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.6)]">
            <p className="text-gray-300 mb-6">
              Have questions, feedback, or just want to say hello? We'd love to hear from you!
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
            
            {submitStatus && (
              <div 
                className={`p-4 mb-6 rounded-lg flex items-start transition-all duration-500 ${
                  submitStatus.success 
                    ? 'bg-green-900/30 text-green-300 border border-green-800' 
                    : 'bg-red-900/30 text-red-300 border border-red-800'
                }`}
              >
                <div className="mr-3 mt-0.5">
                  {submitStatus.success ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>{submitStatus.message}</div>
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
                  onBlur={handleBlur}
                  required
                  className={`w-full p-3 bg-gray-800 rounded-lg text-white border transition-all duration-300 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-accent`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.name}</p>
                )}
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
                  onBlur={handleBlur}
                  required
                  className={`w-full p-3 bg-gray-800 rounded-lg text-white border transition-all duration-300 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-accent`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
                )}
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
                  onBlur={handleBlur}
                  required
                  rows={5}
                  className={`w-full p-3 bg-gray-800 rounded-lg text-white border transition-all duration-300 ${
                    formErrors.message ? 'border-red-500' : 'border-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-accent`}
                ></textarea>
                {formErrors.message && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.message}</p>
                )}
              </div>
              
              <div className="mb-6 text-gray-400 text-sm">
                <p>By submitting this form, you agree to our privacy policy. We'll only use your information to respond to your inquiry and won't share it with third parties.</p>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="neon-button py-2 px-6 rounded-full font-medium w-full transition-all duration-300"
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
          
          <div className="flex justify-center mb-8">
            <Link 
              href="/" 
              className="neon-button py-2 px-6 rounded-full text-center transition-all duration-300"
            >
              Back to Home
            </Link>
          </div>
          
          <div className="bg-card-bg rounded-lg p-6 shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.6)]">
            <h2 className="text-xl font-bold mb-4 transition-all duration-300 hover:scale-105">Connect with Us</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <a 
                href="https://github.com/AdityaB-11" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-105 w-full md:w-auto justify-center md:justify-start"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </a>
              <a 
                href="mailto:contact.adityab11@gmail.com" 
                className="flex items-center gap-3 py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-105 w-full md:w-auto justify-center md:justify-start"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>contact.adityab11@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© 2025 The Cinescope. All rights reserved.</p>
          <p className="mt-1">
            <Link href="/contact/setup-help" className="text-xs text-gray-500 hover:text-accent transition-colors duration-300">
              Developer: Email Setup Guide
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
} 