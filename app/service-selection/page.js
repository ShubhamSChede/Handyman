"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ServicePopup from '../../components/ServicePopup';

// SearchParamsWrapper component that safely uses useSearchParams inside Suspense
function SearchParamsWrapper({ children }) {
  const searchParams = useSearchParams();
  return children(searchParams);
}

export default function ServiceSelectionPage() {
  // Move everything into a Suspense boundary
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <p className="ml-3 text-gray-700">Loading service options...</p>
      </div>
    }>
      <SearchParamsWrapper>
        {(searchParams) => <ServiceSelectionContent searchParams={searchParams} />}
      </SearchParamsWrapper>
    </Suspense>
  );
}

// Move all the component logic into this content component
function ServiceSelectionContent({ searchParams }) {
  const [vendor, setVendor] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get vendorId and service from query params
  const vendorId = searchParams.get('vendorId');
  const service = searchParams.get('service');
  
  useEffect(() => {
    // Try to get vendor from localStorage
    if (typeof window === "undefined") return;
    
    setIsLoading(true);
    const savedVendor = localStorage.getItem('selectedVendor');
    let vendorData = null;
    
    if (savedVendor) {
      try {
        vendorData = JSON.parse(savedVendor);
        setVendor(vendorData);
      } catch (e) {
        console.error("Error parsing saved vendor:", e);
      }
    }
    
    // If vendor not in localStorage but ID is in URL, fetch from API
    if (!vendorData && vendorId) {
      fetch(`http://localhost:3000/api/vendors/${vendorId}`)
        .then(res => res.json())
        .then(data => {
          if (data.vendor) {
            setVendor(data.vendor);
            localStorage.setItem('selectedVendor', JSON.stringify(data.vendor));
          }
        })
        .catch(err => console.error("Error fetching vendor:", err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
    
    // Get selected category from localStorage or create it from service param
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
      try {
        setSelectedCategory(JSON.parse(savedCategory));
      } catch (e) {
        console.error("Error parsing saved category:", e);
      }
    } else if (service) {
      // Create a basic category object from service name
      setSelectedCategory({
        id: service.toLowerCase().replace(/\s+/g, '-'),
        name: service
      });
    }
    
    // Show popup when vendor and category are loaded
    if (vendorData && service) {
      setShowPopup(true);
    }
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing saved cart:", e);
      }
    }
  }, [vendorId, service]);
  
  // Function to add items to cart
  const addToCart = (item) => {
    if (typeof window === "undefined") return;
    
    const existingItemIndex = cart.findIndex(i => i.id === item.id);
    let updatedCart;
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1
      };
    } else {
      // Add new item with quantity of 1
      updatedCart = [...cart, { ...item, quantity: 1 }];
    }
    
    setCart(updatedCart);
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };
  
  // Function to close popup
  const closePopup = () => {
    setShowPopup(false);
    window.location.href = '/cart'; // Redirect to home or cart
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <p className="ml-3 text-gray-700">Loading service details...</p>
      </div>
    );
  }
  
  if (!vendor || !selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <svg className="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Service Not Found</h2>
        <p className="text-gray-600 mb-6">We couldn't find the service or vendor you're looking for.</p>
        <Link 
          href="/search" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Browse Services
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {showPopup && selectedCategory && (
        <ServicePopup
          selectedCategory={selectedCategory}
          onClose={closePopup}
          addToCart={addToCart}
          preselectedVendor={vendor}
        />
      )}
      
      {/* Fallback UI if popup is closed */}
      {!showPopup && (
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold mb-4">Select Services</h1>
          <button 
            onClick={() => setShowPopup(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Show Services
          </button>
        </div>
      )}
    </div>
  );
}