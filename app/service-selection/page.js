"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ServicePopup from '../../components/ServicePopup';

export default function ServiceSelectionPage() {
  const searchParams = useSearchParams();
  const [vendor, setVendor] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  
  // Get vendorId and service from query params
  const vendorId = searchParams.get('vendorId');
  const service = searchParams.get('service');
  
  useEffect(() => {
    // Try to get vendor from localStorage
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
        .catch(err => console.error("Error fetching vendor:", err));
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
    const existingItemIndex = cart.findIndex(i => i.id === item.id);
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1
      };
      setCart(updatedCart);
    } else {
      // Add new item with quantity of 1
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify([...cart, { ...item, quantity: 1 }]));
  };
  
  // Function to close popup
  const closePopup = () => {
    setShowPopup(false);
    window.location.href = '/cart'; // Redirect to home or cart
  };
  
  if (!vendor || !selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
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