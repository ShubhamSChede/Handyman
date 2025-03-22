'use client';

import { Geist, Geist_Mono } from 'next/font/google'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import './globals.css'

// Dynamically import the GeminiChat component
const GeminiChat = dynamic(() => import('../components/GeminiChat'), {
  ssr: false,
})

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Check login status on component mount
  useEffect(() => {
    // Try to get login status from localStorage first
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
    // Check if user data exists in localStorage
    const storedUserData = localStorage.getItem('userData');
    
    if (storedLoginStatus === 'true' && storedUserData) {
      // User is logged in and we have their data
      setIsLoggedIn(true);
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        // If we can't parse the user data, reset the login state
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
      }
    } else if (storedUserData) {
      // If we have user data but login status wasn't set, set it now
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      // No user data, ensure logged out state
      setIsLoggedIn(false);
      localStorage.removeItem('isLoggedIn');
    }
  }, []);

  // Update localStorage whenever login state changes
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      localStorage.removeItem('isLoggedIn');
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('userData');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('phoneNumber');
    
    // Update state
    setIsLoggedIn(false);
    setUserData(null);
    
    // Optional: Redirect to home page
    window.location.href = '/';
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="flex justify-between items-center p-4 h-16 shadow-md">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">My App</h1>
          </div>
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <div className="flex gap-2">
                <a 
                  href="/login" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Sign In
                </a>
                <a 
                  href="/signup" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Sign Up
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {userData?.name || 'User'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
            <button 
              onClick={() => setIsChatOpen(prev => !prev)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Open Gemini AI assistant"
            >
              <svg viewBox="0 0 32 32" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5813 16L31.9999 29.8823L19.5813 16Z" fill="#8E75B2"/>
                <path d="M12.4187 16L0 29.8823L12.4187 16Z" fill="#EF5A28"/>
                <path d="M19.5813 16L12.4188 16L16.0001 2.11768L19.5813 16Z" fill="#876CB2"/>
                <path d="M12.4187 16L0 2.11768L12.4187 16Z" fill="#EA5B28"/>
                <path d="M19.5813 16L32 2.11768L19.5813 16Z" fill="#8E75B2"/>
                <path d="M19.5813 16L12.4188 16L16.0001 29.8823L19.5813 16Z" fill="#876CB2"/>
              </svg>
            </button>
          </div>
        </header>
        {children}
        <GeminiChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </body>
    </html>
  );
}