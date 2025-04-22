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
              <div 
                className={`p-4 mb-6 rounded-lg flex items-start ${
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
                  className={`w-full p-3 bg-gray-800 rounded-lg text-white border ${
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
                  className={`w-full p-3 bg-gray-800 rounded-lg text-white border ${
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
                  className={`w-full p-3 bg-gray-800 rounded-lg text-white border ${
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
          <p className="mt-1">
            <Link href="/contact/setup-help" className="text-xs text-gray-500 hover:text-accent transition-colors">
              Developer: Email Setup Guide
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
} 