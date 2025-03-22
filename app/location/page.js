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

// Fix Leaflet marker icon issue in Next.js - Move to client-side only
const LeafletIcon = dynamic(
  () => {
    return Promise.resolve(() => {
      // Import L only on client side
      const L = require('leaflet');
      return L.icon({
        iconUrl: '/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
    });
  },
  { ssr: false }
);

export default function LocationPage() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [mapCenter, setMapCenter] = useState([15.2993, 74.1240]); // Default to Goa's center
  
  // Add latitude and longitude state variables
  const [latitude, setLatitude] = useState(15.2993);
  const [longitude, setLongitude] = useState(74.1240);
  
  // Detailed address fields
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [landmark, setLandmark] = useState("");
  const [zipCode, setZipCode] = useState("");
  
  // Add role selection
  const [role, setRole] = useState("user");
  
  // Add vendor-specific fields
  const [servicesOffered, setServicesOffered] = useState([]);
  const [serviceInput, setServiceInput] = useState("");
  const [pricing, setPricing] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  
  // Add loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // Add state for Leaflet icon
  const [icon, setIcon] = useState(null);
  
  // Add state to track if the component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);
  
  // Initialize component as mounted only on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if user is authenticated - client side only
  useEffect(() => {
    // Only run on client side
    if (!isMounted) return;
    
    const phoneNumber = localStorage.getItem("userPhoneNumber");
    const userData = localStorage.getItem("userData");
    
    if (!phoneNumber || !userData) {
      router.push('/login');
    }
  }, [isMounted, router]);

  // Modified to store coordinates in localStorage when they change - client side only
  useEffect(() => {
    if (!isMounted) return;
    
    localStorage.setItem("userLatitude", latitude.toString());
    localStorage.setItem("userLongitude", longitude.toString());
  }, [latitude, longitude, isMounted]);

  // Check if user is already authenticated on page load - client side only
  useEffect(() => {
    if (!isMounted) return;

    const savedAddress = localStorage.getItem("userAddress");
    
    // Get coordinates directly from localStorage
    const savedLat = localStorage.getItem("userLatitude");
    const savedLng = localStorage.getItem("userLongitude");
    
    if (savedLat && savedLng) {
      const lat = parseFloat(savedLat);
      const lng = parseFloat(savedLng);
      setLatitude(lat);
      setLongitude(lng);
      setMapCenter([lat, lng]);
    }
    
    if (savedAddress) {
      try {
        const addressData = JSON.parse(savedAddress);
        setLocation(addressData.location || "");
        setHouseNumber(addressData.houseNumber || "");
        setStreet(addressData.street || "");
        setApartment(addressData.apartment || "");
        setLandmark(addressData.landmark || "");
        setZipCode(addressData.zipCode || "");
        setRole(addressData.role || "user");
        
        // Set vendor-specific fields if available
        if (addressData.servicesOffered) {
          setServicesOffered(addressData.servicesOffered);
        }
        if (addressData.pricing) {
          setPricing(addressData.pricing);
        }
        if (addressData.availability) {
          setStartTime(addressData.availability.startTime || "09:00");
          setEndTime(addressData.availability.endTime || "18:00");
        }
        
        // Still use coordinates from address object as backup
        if (addressData.latitude && addressData.longitude && (!savedLat || !savedLng)) {
          setLatitude(addressData.latitude);
          setLongitude(addressData.longitude);
          setMapCenter([addressData.latitude, addressData.longitude]);
        }
      } catch (e) {
        console.error("Error parsing saved address:", e);
      }
    }
    
    // Load user data from API if available
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/updateUser');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const user = data.user;
            
            // Set role and related fields
            setRole(user.role || "user");
            
            // Set vendor-specific fields if role is vendor
            if (user.role === "vendor") {
              setServicesOffered(user.servicesOffered || []);
              setPricing(user.pricing || "");
              if (user.availability) {
                setStartTime(user.availability.startTime || "09:00");
                setEndTime(user.availability.endTime || "18:00");
              }
            }
            
            // Set address fields if available
            if (user.address) {
              setLocation(user.address);
            }
            if (user.landmark) {
              setLandmark(user.landmark);
            }
            
            // Set coordinates if available
            if (user.location && user.location.coordinates && user.location.coordinates.length === 2) {
              const [lng, lat] = user.location.coordinates;
              setLatitude(lat);
              setLongitude(lng);
              setMapCenter([lat, lng]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [isMounted]);

  // Get user's current location - client side only
  const getUserLocation = () => {
    if (!isMounted || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    // Reset any previous errors
    setLocationError("");
    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Update with the position coordinates
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLatitude(lat);
        setLongitude(lng);
        setMapCenter([lat, lng]);
        
        // Perform reverse geocoding if needed
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          
          if (data && data.display_name) {
            setLocation(data.display_name);
          } else {
            setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } catch (error) {
          console.error("Error during reverse geocoding:", error);
          setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        setLocationError(`Error getting location: ${getGeolocationErrorMessage(error)}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Helper function to get a user-friendly geolocation error message
  const getGeolocationErrorMessage = (error) => {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        return "Location permission denied. Please enable location services in your browser settings.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable.";
      case error.TIMEOUT:
        return "Location request timed out.";
      default:
        return "An unknown error occurred.";
    }
  };

  // Handler for adding a service
  const handleAddService = () => {
    if (serviceInput.trim() === "") return;
    
    // Check if service already exists
    if (!servicesOffered.includes(serviceInput.trim())) {
      setServicesOffered([...servicesOffered, serviceInput.trim()]);
    }
    
    setServiceInput("");
  };
  
  // Handler for removing a service
  const handleRemoveService = (serviceToRemove) => {
    setServicesOffered(servicesOffered.filter(service => service !== serviceToRemove));
  };

  // Add manual coordinate update function
  const updateCoordinates = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setMapCenter([lat, lng]);
    
    if (isMounted) {
      localStorage.setItem("userLatitude", lat.toString());
      localStorage.setItem("userLongitude", lng.toString());
    }
  };

  // Update handleSubmit to check for client-side
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location.trim()) {
      alert("Please enter or detect your location");
      return;
    }
    
    // Create an address object for localStorage
    const addressData = {
      location,
      houseNumber,
      street,
      apartment,
      landmark,
      zipCode,
      latitude,
      longitude,
      role,
      servicesOffered,
      pricing: pricing ? parseFloat(pricing) : undefined,
      availability: {
        startTime,
        endTime
      },
      fullAddress: `${houseNumber} ${street}${apartment ? `, ${apartment}` : ''}${landmark ? `, near ${landmark}` : ''}, ${location}${zipCode ? ` - ${zipCode}` : ''}`
    };
    
    // Save to localStorage as fallback (client-side only)
    if (isMounted) {
      localStorage.setItem("userAddress", JSON.stringify(addressData));
      localStorage.setItem("userLatitude", latitude.toString());
      localStorage.setItem("userLongitude", longitude.toString());
    }
    
    // Set submitting state
    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      // Send data to server API
      const response = await fetch('/api/updateUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: addressData.fullAddress,
          location: {
            type: "Point",
            coordinates: [longitude, latitude] // GeoJSON format: [longitude, latitude]
          },
          role,
          // Include vendor-specific fields if the role is vendor
          ...(role === "vendor" && {
            servicesOffered,
            pricing: pricing ? parseFloat(pricing) : undefined,
            availability: {
              startTime,
              endTime
            }
          })
        }),
      });
      
      if (response.ok) {
        // Redirect based on role
        if (role === "vendor") {
          router.push('/dashboard/vendor');
        } else {
          router.push('/dashboard/user');
        }
      } else {
        // Handle error response
        const errorData = await response.json();
        setSubmitError(errorData.message || "Error updating profile. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the map conditionally - client side only
  const renderMap = () => {
    if (!isMounted) return null;
    
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
          <LeafletIcon>
            {(icon) => <Marker position={mapCenter} icon={icon} />}
          </LeafletIcon>
          <MapUpdaterComponent center={mapCenter} />
        </MapContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-black">
            LocalPro
          </Link>
          <nav>
            <ul className="flex space-x-6">
              {['Home', 'Services', 'About', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-600 hover:text-black transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-black">
            Set Your Location & Profile
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
                  Looking for services and professionals in my area
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
                  Offering professional services to customers
                </p>
              </div>
            </div>
          </div>

          {/* Map Container - Dynamically rendered */}
          {renderMap()}
          
          {/* Display current coordinates */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Current coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">Location Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Input */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Location
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="location"
                    placeholder="Enter your location"
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
                      <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {locationError && (
                  <p className="mt-1 text-sm text-red-600">{locationError}</p>
                )}
              </div>
              
              {/* Manual coordinate input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="manualLat" className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude (Manual Override)
                  </label>
                  <input
                    type="number"
                    id="manualLat"
                    step="0.000001"
                    placeholder="e.g. 15.2993"
                    className="w-full p-3 border border-yellow-200 rounded-lg 
                               bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label htmlFor="manualLng" className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude (Manual Override)
                  </label>
                  <input
                    type="number"
                    id="manualLng"
                    step="0.000001"
                    placeholder="e.g. 74.1240"
                    className="w-full p-3 border border-yellow-200 rounded-lg 
                               bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  />
                </div>
              </div>
              
              {/* Button to update map with manual coordinates */}
              <button
                type="button"
                onClick={() => updateCoordinates(latitude, longitude)}
                className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium 
                          rounded-lg transition-colors focus:outline-none focus:ring-2 
                          focus:ring-yellow-300 mb-4"
              >
                Update Map with Manual Coordinates
              </button>

              {/* Detailed Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    House/Building Number
                  </label>
                  <input
                    type="text"
                    id="houseNumber"
                    placeholder="e.g. 123, Apt 4B"
                    className="w-full p-3 border border-blue-200 rounded-lg 
                               bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Name
                  </label>
                  <input
                    type="text"
                    id="street"
                    placeholder="e.g. Main Street"
                    className="w-full p-3 border border-blue-200 rounded-lg 
                               bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-2">
                    Apartment/Suite (Optional)
                  </label>
                  <input
                    type="text"
                    id="apartment"
                    placeholder="e.g. Apt 101, Suite 200"
                    className="w-full p-3 border border-blue-200 rounded-lg 
                               bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    id="landmark"
                    placeholder="e.g. Near City Park"
                    className="w-full p-3 border border-blue-200 rounded-lg 
                               bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    placeholder="e.g. 10001"
                    className="w-full p-3 border border-blue-200 rounded-lg 
                               bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* Quick location presets */}
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Quick location presets:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateCoordinates(15.2832, 73.9862);
                      setLocation("Margao, Goa");
                    }}
                    className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium 
                              rounded-lg transition-colors focus:outline-none focus:ring-2 
                              focus:ring-green-300"
                  >
                    Margao, Goa
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      updateCoordinates(15.4909, 73.8278);
                      setLocation("Panaji, Goa");
                    }}
                    className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium 
                              rounded-lg transition-colors focus:outline-none focus:ring-2 
                              focus:ring-green-300"
                  >
                    Panaji, Goa
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      updateCoordinates(15.3561, 73.9456);
                      setLocation("Ponda, Goa");
                    }}
                    className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium 
                              rounded-lg transition-colors focus:outline-none focus:ring-2 
                              focus:ring-green-300"
                  >
                    Ponda, Goa
                  </button>
                </div>
              </div>
              
              {/* Conditional Vendor Fields */}
              {role === "vendor" && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Service Provider Details</h3>
                  
                  {/* Services Offered */}
                  <div className="mb-6">
                    <label htmlFor="services" className="block text-sm font-medium text-gray-700 mb-2">
                      Services Offered
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="services"
                        placeholder="e.g. Plumbing, Electrical Work"
                        className="w-full p-3 border border-gray-200 rounded-l-lg focus:ring-1 focus:ring-black focus:border-black"
                        value={serviceInput}
                        onChange={(e) => setServiceInput(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleAddService}
                        className="px-4 py-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    
                    {/* Display added services */}
                    {servicesOffered.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Your services:</p>
                        <div className="flex flex-wrap gap-2">
                          {servicesOffered.map((service, index) => (
                            <div 
                              key={index} 
                              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                            >
                              <span>{service}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveService(service)}
                                className="ml-2 text-blue-800 hover:text-blue-900"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Pricing */}
                  <div className="mb-6">
                    <label htmlFor="pricing" className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      id="pricing"
                      placeholder="e.g. 500"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                      value={pricing}
                      onChange={(e) => setPricing(e.target.value)}
                      min="0"
                      required={role === "vendor"}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Set your hourly rate in Indian Rupees
                    </p>
                  </div>
                  
                  {/* Availability */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Hours
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startTime" className="block text-sm text-gray-600 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          id="startTime"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          required={role === "vendor"}
                        />
                      </div>
                      <div>
                        <label htmlFor="endTime" className="block text-sm text-gray-600 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          id="endTime"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          required={role === "vendor"}
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Set your typical working hours (you can adjust specific days later)
                    </p>
                  </div>
                </div>
              )}
              
              {/* Display submit error */}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {submitError}
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-black hover:bg-gray-800 text-white font-medium 
                          rounded-lg transition-colors focus:outline-none focus:ring-2 
                          focus:ring-gray-200"
                disabled={isDetectingLocation || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  role === "vendor" ? "Save Provider Profile & Continue" : "Save Address & Continue"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}