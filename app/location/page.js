"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from 'next/dynamic';

// Dynamically load Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);

// Dynamically load the useMap hook with SSR disabled
const MapUpdaterComponent = dynamic(
  () => import('react-leaflet').then(() => {
    // This will only run on the client
    const { useMap } = require('react-leaflet');
    
    // Map update component (defined inside the dynamic import)
    return function MapUpdater({ center }) {
      const map = useMap();
      useEffect(() => {
        map.setView(center);
      }, [center, map]);
      return null;
    };
  }),
  { ssr: false }
);

export default function LocationPage() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [mapCenter, setMapCenter] = useState([15.2993, 74.1240]); // Default to Goa's center
  const [latitude, setLatitude] = useState(15.2993);
  const [longitude, setLongitude] = useState(74.1240);
  const [role, setRole] = useState("user");
  const [servicesOffered, setServicesOffered] = useState([]);
  const [serviceInput, setServiceInput] = useState("");
  const [pricing, setPricing] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  
  // Initialize component as mounted only on client side
  useEffect(() => {
    setIsMounted(true);
    
    // Load user data
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem('role');
      if (savedRole) setRole(savedRole);
      
      const savedAddress = localStorage.getItem('address');
      if (savedAddress) setLocation(savedAddress);
      
      const savedLandmark = localStorage.getItem('landmark');
      if (savedLandmark) setLandmark(savedLandmark);
      
      const savedLat = localStorage.getItem('userLatitude');
      const savedLng = localStorage.getItem('userLongitude');
      
      if (savedLat && savedLng) {
        const lat = parseFloat(savedLat);
        const lng = parseFloat(savedLng);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          setLatitude(lat);
          setLongitude(lng);
          setMapCenter([lat, lng]);
        }
      }
    }
  }, []);

  // Load Leaflet CSS and configure icons in useEffect, not in render function
  useEffect(() => {
    if (!isMounted) return;
    
    // Asynchronously load Leaflet CSS
    const loadLeafletCSS = async () => {
      try {
        await import('leaflet/dist/leaflet.css');
        
        // Import Leaflet and configure icons
        const L = await import('leaflet');
        delete L.Icon.Default.prototype._getIconUrl;
        
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
        
        setLeafletLoaded(true);
      } catch (error) {
        console.error("Error loading Leaflet:", error);
      }
    };
    
    loadLeafletCSS();
  }, [isMounted]);

  // Check if user is authenticated - client side only
  useEffect(() => {
    if (!isMounted) return;
    
    const phoneNumber = localStorage.getItem("userPhoneNumber");
    if (!phoneNumber) {
      router.push('/login');
    }
  }, [isMounted, router]);
  
  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setLocationError("");
    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLatitude(lat);
        setLongitude(lng);
        setMapCenter([lat, lng]);
        
        // Reverse geocoding
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          
          if (data && data.display_name) {
            setLocation(data.display_name);
          }
        } catch (error) {
          console.error("Error during reverse geocoding:", error);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        setLocationError(`Error getting location: ${error.message}`);
      }
    );
  };

  // Handler for adding a service
  const handleAddService = () => {
    if (serviceInput.trim() === "") return;
    
    if (!servicesOffered.includes(serviceInput.trim())) {
      setServicesOffered([...servicesOffered, serviceInput.trim()]);
    }
    
    setServiceInput("");
  };
  
  // Handler for removing a service
  const handleRemoveService = (serviceToRemove) => {
    setServicesOffered(servicesOffered.filter(service => service !== serviceToRemove));
  };

  // Render map component conditionally, but don't try to import modules here
  const renderMap = () => {
    if (!isMounted || !leafletLoaded) {
      return (
        <div className="h-[300px] mb-8 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading map...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-[300px] mb-8 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={mapCenter} />
          <MapUpdaterComponent center={mapCenter} />
        </MapContainer>
      </div>
    );
  };

  // Submit handler with simplified data and better error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location.trim()) {
      alert("Please enter your location");
      return;
    }
    
    // Save to localStorage
    localStorage.setItem("address", location);
    localStorage.setItem("landmark", landmark || "");
    localStorage.setItem("userLatitude", latitude.toString());
    localStorage.setItem("userLongitude", longitude.toString());
    
    // Create userAddress object
    const addressData = {
      location,
      landmark,
      latitude,
      longitude
    };
    localStorage.setItem("userAddress", JSON.stringify(addressData));
    
    // Set submitting state
    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      // Get the user's phone number for authentication
      const phoneNumber = localStorage.getItem("userPhoneNumber");
      
      if (!phoneNumber) {
        throw new Error("User not authenticated. Please log in again.");
      }
      
      // Prepare simplified data for the API
      const userData = {
        latitude,
        longitude,
        address: location,
        landmark: landmark || "",
        role
      };
      
      // Add vendor-specific fields if needed
      if (role === "vendor") {
        userData.servicesOffered = servicesOffered;
        userData.pricing = pricing ? parseFloat(pricing) : undefined;
        userData.availability = {
          startTime,
          endTime
        };
      }
      
      // Add debug logging to see what's being sent
      console.log("Sending data to API:", {
        url: '/api/updateUser',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-number': phoneNumber
        },
        body: userData
      });
      
      // Send data to server
      const response = await fetch('/api/updateUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-number': phoneNumber
        },
        body: JSON.stringify(userData),
      });
      
      // Log the raw response for debugging
      console.log("API Response status:", response.status, response.statusText);
      
      const data = await response.json();
      console.log("API Response data:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }
      
      // Update user data in localStorage
      if (data.user) {
        try {
          const userData = JSON.parse(localStorage.getItem("userData") || "{}");
          userData.address = location;
          userData.landmark = landmark;
          userData.role = role;
          localStorage.setItem("userData", JSON.stringify(userData));
        } catch (e) {
          console.error("Error updating localStorage:", e);
        }
      }
      
      // Redirect based on role
      router.push('/search');
    } catch (error) {
      console.error("Error submitting data:", error);
      setSubmitError(error.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-black">
            LocalPro
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-black">
            Set Your Location
          </h1>

          {/* Role Selection */}
          <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Select Your Role</h2>
            <div className="flex space-x-4">
              <div 
                className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                  role === "user" 
                    ? "border-black bg-gray-50" 
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setRole("user")}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-5 h-5 rounded-full border ${
                    role === "user" ? "border-4 border-black" : "border border-gray-400"
                  }`}></div>
                  <span className="ml-2 font-medium">I'm a Customer</span>
                </div>
                <p className="text-sm text-gray-600">
                  Looking for services in my area
                </p>
              </div>
              
              <div 
                className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                  role === "vendor" 
                    ? "border-black bg-gray-50" 
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setRole("vendor")}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-5 h-5 rounded-full border ${
                    role === "vendor" ? "border-4 border-black" : "border border-gray-400"
                  }`}></div>
                  <span className="ml-2 font-medium">I'm a Service Provider</span>
                </div>
                <p className="text-sm text-gray-600">
                  Offering services to customers
                </p>
              </div>
            </div>
          </div>

          {/* Map Container */}
          {renderMap()}
          
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">Location Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Input */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Address
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="location"
                    placeholder="Enter your full address"
                    className="w-full p-3 border border-gray-200 rounded-l-lg focus:ring-1 focus:ring-black focus:border-black"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isDetectingLocation}
                    required
                  />
                  <button
                    type="button"
                    onClick={getUserLocation}
                    className="px-4 border border-l-0 border-gray-200 rounded-r-lg hover:bg-gray-50 transition-colors"
                    disabled={isDetectingLocation}
                  >
                    {isDetectingLocation ? (
                      <div className="animate-spin h-5 w-5 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                                        <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                </div>
                                {/* Landmark Input */}
                                <div>
                                  <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-2">
                                    Landmark (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    id="landmark"
                                    placeholder="Enter a nearby landmark"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                                    value={landmark}
                                    onChange={(e) => setLandmark(e.target.value)}
                                  />
                                </div>
                  
                                <button
                                  type="submit"
                                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? 'Saving...' : 'Save Location'}
                                </button>
                              </form>
                            </div>
                          </div>
                        </main>
                      </div>
  );
}
