"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue in Next.js
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Map update component
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

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

  useEffect(() => {
    // Check if user is authenticated
    const phoneNumber = localStorage.getItem("userPhoneNumber");
    const userData = localStorage.getItem("userData");
    
    if (!phoneNumber || !userData) {
      router.push('/login');
      return;
    }
  }, []);

  // Modified to store coordinates in localStorage when they change
  useEffect(() => {
    localStorage.setItem("userLatitude", latitude.toString());
    localStorage.setItem("userLongitude", longitude.toString());
  }, [latitude, longitude]);

  // Check if user is already authenticated on page load
  useEffect(() => {
    // Add authentication check here if needed
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
  }, []);

  // Get user's current location
  const getUserLocation = () => {
    // Reset any previous errors
    setLocationError("");
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Get the latitude and longitude
          const { latitude, longitude } = position.coords;
          
          // Save coordinates to state and localStorage
          setLatitude(latitude);
          setLongitude(longitude);
          setMapCenter([latitude, longitude]);
          
          // Store coordinates in localStorage directly
          localStorage.setItem("userLatitude", latitude.toString());
          localStorage.setItem("userLongitude", longitude.toString());
          
          // Use reverse geocoding to get a human-readable address
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) throw new Error("Could not fetch location data");
          
          const data = await response.json();
          
          // Extract location information
          let locationName = "";
          if (data) {
            const { city, locality, principalSubdivision, countryName } = data;
            // Try to get the most specific location first
            locationName = city || locality || "";
            // Add state/province if available
            if (principalSubdivision && principalSubdivision !== locationName) {
              locationName += locationName ? `, ${principalSubdivision}` : principalSubdivision;
            }
            // If we couldn't get a specific location, use coordinates
            if (!locationName) {
              locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            }
          }
          
          setLocation(locationName || "Location detected");
          
          // DEBUG: Log the detected coordinates and location
          console.log("Detected coordinates:", latitude, longitude);
          console.log("Detected location:", locationName);
          
        } catch (error) {
          console.error("Error getting location:", error);
          setLocationError("Failed to determine your location. Please enter manually.");
          // Still set approximate coordinates as a fallback
          setLocation(`${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsDetectingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable in your browser settings or enter manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable. Please enter manually.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again or enter manually.");
            break;
          default:
            setLocationError("An error occurred while detecting location. Please enter manually.");
        }
      },
      // Set options with timeout and high accuracy
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleAddService = () => {
    if (serviceInput.trim() && !servicesOffered.includes(serviceInput.trim())) {
      setServicesOffered([...servicesOffered, serviceInput.trim()]);
      setServiceInput("");
    }
  };

  const handleRemoveService = (serviceToRemove) => {
    setServicesOffered(servicesOffered.filter(service => service !== serviceToRemove));
  };

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
    
    // Save to localStorage as fallback
    localStorage.setItem("userAddress", JSON.stringify(addressData));
    localStorage.setItem("userLatitude", latitude.toString());
    localStorage.setItem("userLongitude", longitude.toString());
    
    // Set loading state
    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      // Get the phone number from localStorage or session if available
      // Alternatively, you could get this from a global auth state
      // In LocationPage component, replace the phone number retrieval in handleSubmit
      const phoneNumber = localStorage.getItem("userPhoneNumber");
      if (!phoneNumber) {
        // If no phone number is found, redirect to login
        router.push('/login');
        return;
      }
            
      // Prepare the request body based on role
      let requestBody = { 
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        address: addressData.fullAddress, 
        landmark: addressData.landmark || '',
        role: addressData.role
      };
      
      // Add vendor-specific fields if role is vendor
      if (role === "vendor") {
        requestBody = {
          ...requestBody,
          servicesOffered: servicesOffered,
          pricing: pricing ? parseFloat(pricing) : 500, // Default to 500 if not specified
          availability: {
            startTime,
            endTime
          }
        };
      }
      
      // Post the data to the API with phone number in header
      const response = await fetch('http://localhost:3000/api/updateUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-number': phoneNumber
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update user data');
      }
      
      // Parse the response
      const responseData = await response.json();
      console.log("User updated successfully:", responseData);
      
      // Store user data in localStorage if needed
      if (responseData.user) {
        localStorage.setItem("userData", JSON.stringify(responseData.user));
      }
      
      // Redirect based on role
      if (role === "vendor") {
        router.push("/dashboard");
      } else {
        router.push("/search");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      setSubmitError(error.message || "Failed to save your data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add manual coordinate update function
  const updateCoordinates = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setMapCenter([lat, lng]);
    localStorage.setItem("userLatitude", lat.toString());
    localStorage.setItem("userLongitude", lng.toString());
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

          {/* Add Map Container */}
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
              <Marker position={mapCenter} icon={icon} />
              <MapUpdater center={mapCenter} />
            </MapContainer>
          </div>
          
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