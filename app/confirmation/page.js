"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ConfirmationPage() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [vendorId, setVendorId] = useState(null);

  // Get vendorId from booking results in localStorage when the component mounts
  useEffect(() => {
    try {
      const bookingResults = JSON.parse(localStorage.getItem('bookingResults') || '[]');
      if (bookingResults && bookingResults.length > 0) {
        // Get vendorId from the first booking result
        const firstBooking = bookingResults[0];
        if (firstBooking && firstBooking.vendorId) {
          setVendorId(firstBooking.vendorId);
        }
      }
    } catch (err) {
      console.error('Error retrieving booking results:', err);
    }
  }, []);

  const handleStarClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get phone number from localStorage
      const phoneNumber = localStorage.getItem('phoneNumber') || 
                          localStorage.getItem('userPhoneNumber') ||
                          localStorage.getItem('phone') ;
      
      if (!vendorId) {
        throw new Error('Unable to identify the service provider. Please try again later.');
      }
      
      // Prepare review data
      const reviewData = {
        vendorId: vendorId,
        rating: rating,
        comment: comment.trim()
      };
      
      // Make API call to submit the review
      const response = await axios.patch('/api/review', reviewData, {
        headers: {
          'x-phone-number': phoneNumber,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Review submitted successfully:', response.data);
      
      // Show success message
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      
      // Set appropriate error message
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        setError(error.response.data?.message || 'Failed to submit review. Please try again.');
      } else if (error.request) {
        // The request was made but no response was received
        setError('Network error. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request
        setError(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg 
            className="w-16 h-16 text-green-500 mx-auto" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Your service booking has been successfully confirmed. The vendors have been notified via WhatsApp and will contact you shortly.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {!isSubmitted ? (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Rate your booking experience</h2>
            
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="focus:outline-none"
                >
                  <svg 
                    className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <textarea
                  className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  placeholder="Share your experience (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  rating > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit Review'}
              </button>
            </form>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-green-600 font-medium mb-4">
              Thank you for your feedback!
            </p>
            <div className="flex justify-center space-x-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg 
                  key={star}
                  className={`w-6 h-6 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {comment && (
              <p className="text-gray-600 italic">"{comment}"</p>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          <Link href="/" className="block w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Return to Home
          </Link>
          <Link
            href="https://wa.me/9322985826"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Message Me on WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}
