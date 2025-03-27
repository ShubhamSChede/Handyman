"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getBestVendorRecommendation } from '../../utils/aiRecommendation';

// Dynamically import Leaflet components with SSR disabled
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
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);
const useMap = dynamic(
  () => import('react-leaflet').then(mod => mod.useMap),
  { ssr: false }
);

// Client-side only Map wrapper component
const LeafletMap = ({ children, center, zoom }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // Only initialize Leaflet on client side
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div className="h-[300px] bg-gray-100 flex items-center justify-center">Loading map...</div>;
  }
  
  return (
    <MapContainer 
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      {children}
    </MapContainer>
  );
};

// Component to fit map bounds based on markers including user location
const MapBounds = ({ vendors, userLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || typeof map.fitBounds !== 'function') {
      console.log("Map not ready or fitBounds not available");
      return;
    }

    try {
      // Delay the bounds fitting to ensure the map is fully initialized
      const timer = setTimeout(() => {
        if ((vendors.length > 0 || userLocation) && map) {
          // Import Leaflet inside the effect to ensure it runs only in browser
          const L = window.L || require('leaflet');
          if (!L || !L.latLngBounds) {
            console.error("Leaflet not properly loaded");
            return;
          }
          
          const bounds = L.latLngBounds([]);
          
          // Add vendors to bounds
          let hasValidPoints = false;
          vendors.forEach(vendor => {
            if (vendor.location && vendor.location.coordinates) {
              try {
                bounds.extend([vendor.location.coordinates[1], vendor.location.coordinates[0]]);
                hasValidPoints = true;
              } catch (e) {
                console.error("Error adding vendor to bounds:", e);
              }
            }
          });
          
          // Add user location to bounds if available
          if (userLocation && userLocation.lat && userLocation.lng) {
            try {
              bounds.extend([userLocation.lat, userLocation.lng]);
              hasValidPoints = true;
            } catch (e) {
              console.error("Error adding user location to bounds:", e);
            }
          }
          
          // Only fit bounds if we have at least one valid point
          if (hasValidPoints && bounds.isValid && bounds.isValid()) {
            console.log("Fitting bounds:", bounds);
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 13
            });
          } else {
            console.log("No valid bounds to fit");
          }
        }
      }, 300); // Small delay to ensure map is ready
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error("Error fitting map bounds:", error);
    }
  }, [map, vendors, userLocation]);
  
  return null;
};

// SearchParamsWrapper component that safely uses useSearchParams inside Suspense
function SearchParamsWrapper({ children }) {
  const searchParams = useSearchParams();
  return children(searchParams);
}

export default function ResultsPage() {
  // Instead of directly using useSearchParams at the top level, we'll wait for the Suspense boundary
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading service providers...</p>
      </div>
    }>
      <SearchParamsWrapper>
        {(searchParams) => <ResultsContent searchParams={searchParams} />}
      </SearchParamsWrapper>
    </Suspense>
  );
}

// Move the main component logic into ResultsContent
function ResultsContent({ searchParams }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  // Add AI recommendation states
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [DefaultIcon, setDefaultIcon] = useState(null);
  const [UserLocationIcon, setUserLocationIcon] = useState(null);
  
  // Get service from query params
  const service = searchParams.get('service');
  
  // Initialize Leaflet icons only on client-side
  useEffect(() => {
    // Import Leaflet dynamically to avoid SSR issues
    import('leaflet').then(L => {
      // Import CSS
      import('leaflet/dist/leaflet.css');
      
      // Fix Leaflet marker icon issue
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      
      // Create a red icon for the user's location
      const UserLocationIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [30, 45],
        iconAnchor: [15, 45],
      });
      
      L.Marker.prototype.options.icon = DefaultIcon;
      
      setDefaultIcon(DefaultIcon);
      setUserLocationIcon(UserLocationIcon);
      setLeafletLoaded(true);
      
      // Also expose these for direct access when needed
      window.DefaultIcon = DefaultIcon;
      window.UserLocationIcon = UserLocationIcon;
      window.L = L.default || L;
    });
  }, []);
  
  // Load user location from localStorage - safely handling client-side only code
  useEffect(() => {
    // Safe check for browser environment
    if (typeof window !== "undefined") {
      try {
        const userLatitude = localStorage.getItem("userLatitude");
        const userLongitude = localStorage.getItem("userLongitude");
        
        if (userLatitude && userLongitude) {
          setUserLocation({
            lat: parseFloat(userLatitude),
            lng: parseFloat(userLongitude)
          });
        }
      } catch (error) {
        console.error("Error loading user location:", error);
      }
    }
  }, []);
  
  // Fetch vendors from API when component mounts or service changes
  useEffect(() => {
    const fetchVendors = async () => {
      if (!service) return;
      
      try {
        setLoading(true);
        
        // Use relative URL instead of absolute URL with localhost
        const response = await fetch(`/api/findVendors?service=${encodeURIComponent(service)}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Vendors data:", data);
        setVendors(data.vendors || []);
        
        // Get AI recommendation after loading vendors
        if (data.vendors && data.vendors.length > 0 && userLocation) {
          await getAiRecommendation(data.vendors, service);
        }
      } catch (err) {
        console.error("Error fetching vendors:", err);
        setError(err.message || "Failed to load service providers");
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendors();
  }, [service, userLocation]);
  
  // Function to get AI recommendation
  const getAiRecommendation = async (vendorData, serviceName) => {
    if (!vendorData || vendorData.length === 0 || !userLocation) return;
    
    setLoadingRecommendation(true);
    try {
      const recommendation = await getBestVendorRecommendation(
        vendorData, 
        serviceName,
        userLocation
      );
      
      console.log("AI Recommendation:", recommendation);
      setAiRecommendation(recommendation);
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
    } finally {
      setLoadingRecommendation(false);
    }
  };
  
  const handleVendorSelect = (vendor) => {
    // Safe check for browser environment
    if (typeof window === "undefined") return;
    
    // Store selected vendor in localStorage
    localStorage.setItem('selectedVendor', JSON.stringify(vendor));
    
    // Load the selected category from localStorage
    const savedCategory = localStorage.getItem('selectedCategory');
    let categoryData = null;
    
    if (savedCategory) {
      try {
        categoryData = JSON.parse(savedCategory);
      } catch (e) {
        console.error("Error parsing saved category:", e);
      }
    }
    
    // Navigate to service selection page with vendor and service info
    window.location.href = `/service-selection?vendorId=${vendor._id}&service=${encodeURIComponent(service)}`;
  };
  
  // Calculate distance between user and vendor (in km)
  const calculateDistance = (vendorCoords) => {
    if (!userLocation || !vendorCoords || !Array.isArray(vendorCoords) || vendorCoords.length < 2) {
      return "Unknown";
    }
    
    const lat1 = userLocation.lat;
    const lon1 = userLocation.lng;
    const lat2 = vendorCoords[1]; // Latitude
    const lon2 = vendorCoords[0]; // Longitude
    
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 
      ? `${(distance * 1000).toFixed(0)}m away`
      : `${distance.toFixed(1)}km away`;
  };

  // Calculate map center based on user location or average of all vendor coordinates
  const mapCenter = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : vendors.length > 0 && vendors[0].location && vendors[0].location.coordinates
      ? [vendors[0].location.coordinates[1], vendors[0].location.coordinates[0]]
      : [15.2993, 74.1240]; // Default to center of Goa

  // Function to create a recommended vendor icon
  const getRecommendedIcon = () => {
    if (!leafletLoaded) return null;
    
    // Import Leaflet here to ensure it runs only in browser
    const L = window.L;
    return L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Rest of the component remains the same */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-black">
              LocalPro
            </Link>
            <Link href="/cart" className="flex items-center text-sm text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              View Cart
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/search" className="text-blue-600 hover:underline flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to services
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {service} Service Providers
        </h1>
        <p className="text-gray-600 mb-6">
          Choose from available service providers in your area
        </p>

        {/* AI Recommendation Banner */}
        {aiRecommendation && (
          <div className="bg-indigo-50 p-4 rounded-lg shadow mb-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-indigo-800">AI Recommended Provider</h3>
                  {loadingRecommendation && (
                    <div className="animate-pulse text-sm text-indigo-500 flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing providers...
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-start">
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-800">
                      {aiRecommendation.bestVendor.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{aiRecommendation.reasoning}</p>
                  </div>
                  <button
                    onClick={() => handleVendorSelect(aiRecommendation.bestVendor)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Select Recommended
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Finding service providers near you...</p>
          </div>
        )}

        {/* Show error state */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg shadow mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Map - Modified to use client-side rendering only */}
        {!loading && !error && (vendors.length > 0 || userLocation) && leafletLoaded && (
          <div className="mb-6 rounded-lg overflow-hidden shadow-md" style={{ height: "300px" }}>
            <LeafletMap 
              center={mapCenter}
              zoom={13}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Display user's location marker with red icon */}
              {userLocation && UserLocationIcon && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={UserLocationIcon}>
                  <Popup>
                    <p className="font-bold">Your Location</p>
                  </Popup>
                </Marker>
              )}
              
              {/* Display vendor markers */}
              {vendors.map(vendor => 
                vendor.location && vendor.location.coordinates && DefaultIcon ? (
                  <Marker 
                    key={vendor._id}
                    position={[vendor.location.coordinates[1], vendor.location.coordinates[0]]}
                    // Use a different icon for recommended vendor
                    icon={aiRecommendation?.bestVendor?._id === vendor._id && leafletLoaded
                      ? getRecommendedIcon() 
                      : DefaultIcon}
                  >
                    <Popup>
                      <div className="p-1">
                        <p className="font-bold text-gray-900">
                          {vendor.name}
                          {aiRecommendation?.bestVendor?._id === vendor._id && 
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-1">
                              Recommended
                            </span>
                          }
                        </p>
                        <p className="text-sm text-gray-600">{vendor.address}</p>
                        {vendor.reviews && vendor.reviews.length > 0 && (
                          <p className="text-sm flex items-center mt-1">
                            <span className="text-yellow-400 mr-1">★</span> 
                            {(vendor.reviews.reduce((acc, rev) => acc + rev.rating, 0) / vendor.reviews.length).toFixed(1)}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              )}
              
              {/* Fit map bounds to include all markers including user location */}
              <MapBounds vendors={vendors} userLocation={userLocation} />
            </LeafletMap>
          </div>
        )}
        
        {!loading && !error && (vendors.length > 0 || userLocation) && !leafletLoaded && (
          <div className="mb-6 rounded-lg overflow-hidden shadow-md h-[300px] bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* Vendor list */}
        {!loading && !error && vendors.length > 0 ? (
          <div className="grid gap-4">
            {vendors.map(vendor => {
              const isRecommended = aiRecommendation?.bestVendor?._id === vendor._id;
              return (
                <div 
                  key={vendor._id}
                  className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${
                    isRecommended ? 'border-2 border-indigo-300 relative' : ''
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 -right-2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full shadow">
                      AI Recommended
                    </div>
                  )}
                  <div className="flex justify-between">
                    <div>
                      <h2 className="font-bold text-lg text-gray-900">{vendor.name}</h2>
                      <p className="text-sm text-gray-500">
                        {vendor.address} {vendor.landmark ? `(Near ${vendor.landmark})` : ''}
                      </p>
                      
                      <div className="mt-2 space-y-1">
                        {vendor.servicesOffered && (
                          <p className="text-sm">
                            <span className="text-gray-600 font-medium">Services: </span>
                            {vendor.servicesOffered.join(', ')}
                          </p>
                        )}
                        
                        {vendor.availability && (
                          <p className="text-sm">
                            <span className="text-gray-600 font-medium">Hours: </span>
                            {vendor.availability.startTime} - {vendor.availability.endTime}
                          </p>
                        )}
                        
                        <p className="text-sm">
                          <span className="text-gray-600 font-medium">Pricing: </span>
                          ₹{vendor.pricing}/hour
                        </p>
                        
                        {vendor.location && vendor.location.coordinates && userLocation && (
                          <p className="text-sm">
                            <span className="text-gray-600 font-medium">Distance: </span>
                            {calculateDistance(vendor.location.coordinates)}
                          </p>
                        )}
                        
                        {vendor.reviews && vendor.reviews.length > 0 && (
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-400 mr-1">★</span>
                            <span className="text-sm font-medium">
                              {(vendor.reviews.reduce((acc, rev) => acc + rev.rating, 0) / vendor.reviews.length).toFixed(1)}
                            </span>
                            <span className="text-gray-500 text-sm ml-1">
                              ({vendor.reviews.length} {vendor.reviews.length === 1 ? 'review' : 'reviews'})
                            </span>
                          </div>
                        )}
                        
                        {/* Add AI reasoning if this is the recommended vendor */}
                        {isRecommended && aiRecommendation.reasoning && (
                          <div className="mt-2 text-xs text-indigo-800 bg-indigo-50 p-2 rounded italic">
                            <span className="font-semibold">Why recommended: </span>{aiRecommendation.reasoning}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-between items-end">
                      <span className={`px-2 py-1 rounded-full text-xs ${vendor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {vendor.isAvailable ? 'Available Now' : 'Unavailable'}
                      </span>
                      
                      <button
                        onClick={() => handleVendorSelect(vendor)}
                        disabled={!vendor.isAvailable}
                        className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                          vendor.isAvailable 
                            ? isRecommended 
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Select Provider
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !loading && !error && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No Service Providers Found</h2>
            <p className="text-gray-600">
              We couldn't find any service providers offering {service} in your area.
            </p>
            <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Browse Other Services
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}