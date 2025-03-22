"use client"
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { getBestVendorRecommendation } from '../utils/aiRecommendation';

// Dynamically import Leaflet components with no SSR
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
const Polyline = dynamic(
  () => import('react-leaflet').then(mod => mod.Polyline),
  { ssr: false }
);
const useMap = dynamic(
  () => import('react-leaflet').then(mod => mod.useMap),
  { ssr: false }
);

// Dynamically import Leaflet to avoid SSR issues
const LeafletInit = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const [defaultIcon, setDefaultIcon] = useState(null);
  const [userLocationIcon, setUserLocationIcon] = useState(null);
  
  useEffect(() => {
    // Only import Leaflet on the client side
    if (typeof window !== 'undefined') {
      // Import the CSS first to ensure proper styling
      import('leaflet/dist/leaflet.css').then(() => {
        // Then import Leaflet
        import('leaflet').then((L) => {
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
            className: 'user-location-marker',
          });

          // Set the default icon
          L.Marker.prototype.options.icon = DefaultIcon;
          
          // Set global variables for use in child components
          window.DefaultIcon = DefaultIcon;
          window.UserLocationIcon = UserLocationIcon;
          window.L = L; // Make L globally available
          
          // Update state with icons
          setDefaultIcon(DefaultIcon);
          setUserLocationIcon(UserLocationIcon);
          
          console.log("Leaflet initialized successfully");
          setIsClient(true);
          setLeafletReady(true);
        }).catch(err => {
          console.error("Failed to load Leaflet:", err);
        });
      }).catch(err => {
        console.error("Failed to load Leaflet CSS:", err);
      });
    }
  }, []);

  // Only render children when on client-side and Leaflet is ready
  if (!isClient || !leafletReady || !defaultIcon || !userLocationIcon) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }
  
  // Clone children and pass icons as props
  return React.Children.map(children, child => {
    return React.cloneElement(child, { 
      defaultIcon,
      userLocationIcon
    });
  });
};

// Simple DirectRoute component that uses Polyline
const DirectRoute = ({ userLocation, vendorLocation, showRoute }) => {
  if (!userLocation || !vendorLocation || !showRoute) return null;
  
  const positions = [
    [userLocation.lat, userLocation.lng],
    [vendorLocation.lat, vendorLocation.lng]
  ];
  
  return (
    <Polyline 
      positions={positions}
      pathOptions={{ 
        color: '#6366F1', 
        weight: 4, 
        opacity: 0.7,
        dashArray: '10, 10'
      }}
    />
  );
};

// Component to fit map bounds based on markers including user location
const MapBounds = ({ vendors, userLocation }) => {
  // Get map reference from useMap hook
  const map = useMap();
  
  useEffect(() => {
    // Check if map exists and the fitBounds method is available
    if (!map || typeof map.fitBounds !== 'function') {
      console.log("Map not ready or fitBounds not available");
      return;
    }
    
    // Add a delay to ensure the map is fully loaded
    const timer = setTimeout(() => {
      try {
        // Create an array to collect valid coordinate points
        let points = [];
        let hasPoints = false;
        
        // Add vendor locations to points array
        if (vendors && Array.isArray(vendors) && vendors.length > 0) {
          vendors.forEach(vendor => {
            if (vendor.location && 
                vendor.location.coordinates && 
                Array.isArray(vendor.location.coordinates) && 
                vendor.location.coordinates.length >= 2) {
              points.push([vendor.location.coordinates[1], vendor.location.coordinates[0]]);
              hasPoints = true;
            }
          });
        }
        
        // Add user location if available
        if (userLocation && userLocation.lat && userLocation.lng) {
          points.push([userLocation.lat, userLocation.lng]);
          hasPoints = true;
        }
        
        // Only proceed if we have points to fit
        if (hasPoints && points.length > 0) {
          console.log("Fitting map to points:", points);
          
          // As a fallback, try setting view to the first point
          if (points.length === 1) {
            map.setView(points[0], 13);
            return;
          }
          
          try {
            if (typeof window !== 'undefined' && window.L) {
              // Create bounds object
              const bounds = window.L.latLngBounds(points);
              
              // Verify bounds are valid
              if (bounds.isValid && bounds.isValid()) {
                console.log("Fitting to bounds:", bounds);
                map.fitBounds(bounds, { 
                  padding: [50, 50],
                  maxZoom: 13
                });
              } else {
                console.log("Invalid bounds:", bounds);
                // Fallback: center on first point
                map.setView(points[0], 10);
              }
            } else {
              throw new Error("Leaflet not available");
            }
          } catch (boundsError) {
            console.error("Error with bounds:", boundsError);
            
            // Direct fallback: manually calculate center and use it
            if (points.length > 0) {
              const avgLat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
              const avgLng = points.reduce((sum, p) => sum + p[1], 0) / points.length;
              map.setView([avgLat, avgLng], 10);
            }
          }
        }
      } catch (error) {
        console.error("Error fitting map bounds:", error);
      }
    }, 500); // Added 500ms delay to ensure map is ready
    
    return () => clearTimeout(timer);
  }, [map, vendors, userLocation]);
  
  return null;
};

// Create a wrapper for the map content to receive icon props
const MapContent = ({ center, vendors, userLocation, routingState, defaultIcon, userLocationIcon }) => {
  return (
    <MapContainer 
      center={center}
      zoom={10}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Display user's location marker with red icon */}
      {userLocation && userLocation.lat && userLocation.lng && userLocationIcon && (
        <Marker 
          position={[userLocation.lat, userLocation.lng]}
          icon={userLocationIcon}
        >
          <Popup>
            <div className="p-1">
              <p className="font-bold text-red-600">Your Location</p>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Display vendor markers */}
      {vendors && Array.isArray(vendors) && defaultIcon && vendors.map((vendor) => (
        vendor && vendor.location && vendor.location.coordinates ? (
          <Marker 
            key={vendor.clerkId || vendor._id || Math.random().toString()}
            position={[vendor.location.coordinates[1], vendor.location.coordinates[0]]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-gray-900">{vendor.name}</p>
                <p className="text-sm text-gray-600">
                  Services: {vendor.servicesOffered
                    .map(s => s.replace(/-/g, ' '))
                    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(", ")}
                </p>
                <p className="text-sm mt-1">
                  <span className="font-semibold text-gray-900">₹{vendor.pricing}</span> per hour
                </p>
                <p className="text-sm text-gray-600">{vendor.address}</p>
                {vendor.reviews && vendor.reviews.length > 0 && (
                  <p className="text-sm mt-1 flex items-center">
                    <span className="text-yellow-500 mr-1">★</span> 
                    {(vendor.reviews.reduce((acc, review) => acc + review.rating, 0) / vendor.reviews.length).toFixed(1)}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
      
      {/* Fit map bounds to include all markers including user location */}
      <MapBounds 
        vendors={vendors ? vendors.filter(vendor => 
          vendor && vendor.location && vendor.location.coordinates
        ) : []} 
        userLocation={userLocation}
      />
      
      {/* Show DIRECT route if requested */}
      {userLocation && routingState && routingState.showRoute && routingState.vendorLocation && (
        <DirectRoute 
          userLocation={userLocation}
          vendorLocation={routingState.vendorLocation}
          showRoute={routingState.showRoute}
        />
      )}
    </MapContainer>
  );
};

// Services data for different categories
const servicesData = [
  {
    id: "home-maintenance",
    name: "Home Maintenance",
    services: [
      { id: "pest-control", name: "Pest Control", cost: 1000, unit: "per room" },
      { id: "bathroom-clean", name: "Per Bathroom Clean", cost: 400 },
      { id: "chimney-clean", name: "Chimney Cleaning", cost: 400, unit: "per chimney" },
      { id: "kitchen-clean", name: "Kitchen Clean", cost: 400 },
      { id: "sofa-clean", name: "Sofa Cleaning", cost: 1000 },
    ],
  },
  {
    id: "plumbing",
    name: "Plumbing",
    services: [
      { id: "wash-basin", name: "Wash Basin Servicing", cost: 500 },
      { id: "pipe-replacement", name: "Pipe Replacement", cost: 140 },
      { id: "tile-grouting", name: "Tile Grouting", cost: 1000 },
      { id: "toilet-repair", name: "Toilet Repair", cost: 700 },
      { id: "tap-installation", name: "Tap Installation", cost: 150 },
    ],
  },
  {
    id: "carpenter",
    name: "carpenter",
    services: [
      { id: "bed-support", name: "Bed Support", cost: 460 },
      { id: "hinge-installation", name: "Hinge Installation", cost: 199 },
      { id: "wooden-door-repair", name: "Wooden Door Repair", cost: 300 },
      { id: "door-lock-installation", name: "Door Lock Installation", cost: 560 },
    ],
  },
  {
    id: "ac-appliances",
    name: "ac-appliances",
    services: [
      { id: "deep-clean", name: "Deep Clean Service", cost: 2000 },
      { id: "light-servicing", name: "Light Servicing", cost: 800 },
      { id: "cooling-repair", name: "Cooling Repair", cost: 1200 },
      { id: "water-leak", name: "Water Leak Fix", cost: 1800 },
      { id: "installation-uninstallation", name: "Installation & Uninstallation", cost: 1500 },
    ],
  },
  {
    id: "Electrical",
    name: "Electrical",
    services: [
      { id: "switchboard-installation", name: "Switchboard Installation", cost: 100 },
      { id: "fan-repair", name: "Fan Repair", cost: 400 },
      { id: "ceiling-light", name: "Ceiling Light Installation", cost: 260 },
      { id: "doorbell-installation", name: "Doorbell Installation", cost: 300 },
    ],
  },
  {
    id: "coconut-removal",
    name: "coconut-removal",
    services: [
      { id: "coconut-removal-service", name: "Coconut Removal", cost: 100 },
    ],
  },
];

const ServicePopup = ({ selectedCategory, onClose, addToCart, preselectedVendor = null }) => {
  // Add state for the selected vendor and their services
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  // Add state to track added items
  const [addedItems, setAddedItems] = useState({});
  // Add state for vendors data
  const [vendors, setVendors] = useState([]);
  // Add loading state
  const [loading, setLoading] = useState(false);
  // Error state for API requests
  const [error, setError] = useState(null);
  // Add state for user location
  const [userLocation, setUserLocation] = useState(null);
  // Add state for routing
  const [routingState, setRoutingState] = useState({
    showRoute: false,
    vendorLocation: null
  });
  // Reference to the map component
  const mapRef = useRef(null);
  // Add state for AI recommendation
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  // Find the appropriate service category from servicesData
  const matchedServiceCategory = useMemo(() => {
    if (!selectedCategory) return null;
    
    return servicesData.find(category => 
      category.name.toLowerCase() === selectedCategory.name.toLowerCase() ||
      category.id.toLowerCase() === selectedCategory.name.toLowerCase()
    );
  }, [selectedCategory]);

  // Get user's location from localStorage
  useEffect(() => {
    const getUserLocationFromStorage = () => {
      try {
        const userLatitude = localStorage.getItem("userLatitude");
        const userLongitude = localStorage.getItem("userLongitude");
        
        if (userLatitude && userLongitude) {
          const parsedLat = parseFloat(userLatitude);
          const parsedLng = parseFloat(userLongitude);
          
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            setUserLocation({
              lat: parsedLat,
              lng: parsedLng
            });
            console.log("User location set from localStorage coordinates:", parsedLat, parsedLng);
            return;
          }
        }
        
        // Fallback to address object if direct coordinates not found
        const savedAddress = localStorage.getItem("userAddress");
        if (savedAddress) {
          const addressData = JSON.parse(savedAddress);
          if (addressData.latitude && addressData.longitude) {
            setUserLocation({
              lat: addressData.latitude,
              lng: addressData.longitude
            });
            console.log("User location set from saved address:", addressData.latitude, addressData.longitude);
          }
        }
      } catch (err) {
        console.error("Error getting user location from storage:", err);
      }
    };
    
    getUserLocationFromStorage();
  }, []);

  // Fetch vendors when component mounts or selectedCategory changes
  useEffect(() => {
    const fetchVendors = async () => {
      if (!selectedCategory) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // If preselectedVendor is provided, use it instead of fetching
        if (preselectedVendor) {
          setVendors([preselectedVendor]);
          setSelectedVendor(preselectedVendor);
          return;
        }
        
        // Make API call to fetch vendors with updated endpoint
        const response = await fetch(`http://localhost:3000/api/findVendors?service=${encodeURIComponent(selectedCategory.name)}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Vendors data:", data);
        setVendors(data.vendors || []);
        
        // Get AI recommendation after loading vendors
        if (data.vendors && data.vendors.length > 0) {
          await getAiRecommendation(data.vendors);
        }
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError('Failed to load vendors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendors();
  }, [selectedCategory, userLocation, preselectedVendor]);

  // Function to get AI recommendation
  const getAiRecommendation = async (vendorData) => {
    if (!vendorData || vendorData.length === 0) return;
    
    setLoadingRecommendation(true);
    try {
      const recommendation = await getBestVendorRecommendation(
        vendorData, 
        selectedCategory.name,
        userLocation
      );
      
      console.log("AI Recommendation:", recommendation);
      setAiRecommendation(recommendation);
      
      // Auto-select the recommended vendor if available
      if (recommendation?.bestVendor) {
        setSelectedVendor(recommendation.bestVendor);
      }
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Reset selected vendor when closing popup
  useEffect(() => {
    return () => {
      setSelectedVendor(null);
      setSelectedService(null);
    };
  }, []);

  // Modified addToCart handler for vendor's services
  const handleAddToCart = (service, vendor) => {
    const serviceToAdd = {
      id: `${vendor._id || vendor.clerkId}-${service.id}`,
      name: `${service.name} by ${vendor.name}`,
      cost: service.cost,
      unit: service.unit || "service",
      description: `${service.name} provided by ${vendor.name} in ${vendor.address || 'your area'}`,
      vendorId: vendor._id || vendor.clerkId,
      vendorName: vendor.name,
      vendorPhone: vendor.phoneNumber || vendor.phone, // Add vendor phone number
      serviceId: service.id
    };
    
    addToCart(serviceToAdd);
    setAddedItems(prev => ({
      ...prev,
      [`${vendor._id || vendor.clerkId}-${service.id}`]: true
    }));

    // Reset the button state after 1 second
    setTimeout(() => {
      setAddedItems(prev => ({
        ...prev,
        [`${vendor._id || vendor.clerkId}-${service.id}`]: false
      }));
    }, 1000);
  };

  // Handle selecting a vendor
  const handleSelectVendor = (vendor) => {
    // If already selected, unselect
    if (selectedVendor && selectedVendor._id === vendor._id) {
      setSelectedVendor(null);
      setSelectedService(null);
    } else {
      setSelectedVendor(vendor);
      setSelectedService(null); // Reset selected service when changing vendor
    }
  };

  // Handle showing/hiding route to vendor
  const toggleRoute = (vendor) => {
    console.log("Toggle route for vendor:", vendor);
    
    if (routingState.showRoute && 
        routingState.vendorLocation && 
        routingState.vendorLocation.id === vendor._id) {
      // If route is already shown for this vendor, hide it
      setRoutingState({
        showRoute: false,
        vendorLocation: null
      });
    } else {
      // Show route to this vendor
      if (!vendor.location || !vendor.location.coordinates) {
        alert("Vendor location not available for directions");
        return;
      }
      
      if (!userLocation) {
        alert("Your location is not available. Please enable location services.");
        return;
      }
      
      const vendorLat = vendor.location.coordinates[1];
      const vendorLng = vendor.location.coordinates[0];
      
      console.log("Setting up route to vendor at:", vendorLat, vendorLng);
      console.log("From user location:", userLocation.lat, userLocation.lng);
      
      setRoutingState({
        showRoute: true,
        vendorLocation: {
          id: vendor._id || vendor.clerkId,
          lat: vendorLat,
          lng: vendorLng
        }
      });
    }
  };

  // Add animation effect when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!selectedCategory) return null;

  // Safely filter vendors - ensure vendors is an array and check properties safely
  const filteredVendors = Array.isArray(vendors) 
    ? vendors.filter(vendor => 
        vendor && 
        vendor.role === "vendor" && 
        Array.isArray(vendor.servicesOffered) &&
        vendor.servicesOffered.some(service => 
          service && (
            service.toLowerCase() === selectedCategory.name.toLowerCase() ||
            service.replace(/-/g, ' ').toLowerCase() === selectedCategory.name.toLowerCase()
          )
        )
      )
    : [];
  
  // Determine if we should show the vendor list based on whether any vendors offer this service
  const showVendorList = filteredVendors.length > 0;

  // Calculate map center based on user location or average of all vendor coordinates
  const mapCenter = useMemo(() => {
    // Prioritize user location for initial map center if available
    if (userLocation && userLocation.lat && userLocation.lng) {
      return [userLocation.lat, userLocation.lng];
    }
    
    if (filteredVendors.length === 0) return [15.2993, 74.1240]; // Default to center of Goa
    
    const totalCoords = filteredVendors.reduce(
      (acc, vendor) => {
        // Ensure location coordinates exist and are valid
        if (vendor.location && 
            vendor.location.coordinates && 
            Array.isArray(vendor.location.coordinates) &&
            vendor.location.coordinates.length >= 2) {
          return [
            acc[0] + vendor.location.coordinates[1], // latitude 
            acc[1] + vendor.location.coordinates[0]  // longitude
          ];
        }
        return acc;
      }, 
      [0, 0]
    );
    
    return [
      totalCoords[0] / filteredVendors.length, 
      totalCoords[1] / filteredVendors.length
    ];
  }, [filteredVendors, userLocation]);

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 bg-opacity-80 backdrop-blur-lg flex items-center justify-center z-50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white p-6 rounded-xl w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 500 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b pb-3 mb-4 sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory.name}
              {showVendorList && <span className="text-sm font-normal text-gray-500 block">Available Vendors</span>}
            </h2>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Show loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading vendors...</p>
            </div>
          )}

          {/* Show error state */}
          {error && (
            <div className="bg-red-50 p-4 rounded-md my-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* AI Recommendation Banner */}
          {!loading && !error && aiRecommendation && aiRecommendation.bestVendor && (
            <motion.div 
              className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-indigo-800">AI Recommended Provider</h3>
                    {loadingRecommendation && (
                      <div className="animate-pulse text-xs text-indigo-500">Analyzing...</div>
                    )}
                  </div>
                  <p className="text-base font-medium text-gray-800 mt-1">{aiRecommendation.bestVendor.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{aiRecommendation.reasoning}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Map */}
          {!loading && !error && (showVendorList || userLocation) && (
            <div className="mb-4 rounded-lg overflow-hidden border border-gray-200" style={{ height: "300px" }}>
              <LeafletInit>
                <MapContent 
                  center={mapCenter}
                  vendors={filteredVendors}
                  userLocation={userLocation}
                  routingState={routingState}
                />
              </LeafletInit>
            </div>
          )}

          <div className="space-y-4 overflow-visible">
            {!loading && !error && showVendorList ? (
              filteredVendors.map((vendor) => (
                <motion.div
                  key={vendor.clerkId || vendor._id || Math.random().toString()}
                  className={`p-3 rounded-lg transition-colors border ${
                    selectedVendor && selectedVendor._id === vendor._id 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : aiRecommendation?.bestVendor?._id === vendor._id
                        ? 'border-indigo-300 bg-indigo-50/50' 
                        : 'border-gray-100 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700">Availability: </span>
                          <span className="text-gray-600 text-sm">
                            {vendor.isAvailable ? `${vendor.availability.startTime} - ${vendor.availability.endTime}` : "Not available"}
                          </span>
                        </div>
                      
                      <div className="mt-2 flex items-center">
                        <span className="text-gray-900 font-bold">₹{vendor.pricing}</span>
                        <span className="text-gray-500 ml-1 text-sm">per hour</span>
                      </div>
                      {vendor.reviews && vendor.reviews.length > 0 && (
                        <div className="mt-1 flex items-center">
                          <span className="text-sm font-medium text-gray-700">Rating: </span>
                          <span className="flex items-center ml-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="text-gray-600 text-sm ml-1">
                              {(vendor.reviews.reduce((acc, review) => acc + review.rating, 0) / vendor.reviews.length).toFixed(1)}
                            </span>
                          </span>
                        </div>
                      )}
                      
                      {/* Add directions button */}
                      <div className="mt-2 flex space-x-2">
                        {userLocation && vendor.location && vendor.location.coordinates && (
                          <button 
                            onClick={() => toggleRoute(vendor)}
                            className={`px-3 py-1 text-xs rounded-md border flex items-center gap-1 ${
                              routingState.showRoute && routingState.vendorLocation && routingState.vendorLocation.id === (vendor._id || vendor.clerkId)
                                ? 'bg-blue-100 border-blue-400 text-blue-600' 
                                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
                            </svg>
                            {routingState.showRoute && routingState.vendorLocation && routingState.vendorLocation.id === (vendor._id || vendor.clerkId)
                              ? 'Hide Directions' 
                              : 'Get Directions'}
                          </button>
                        )}
                        
                        {/* Add select vendor button */}
                        <button
                          onClick={() => handleSelectVendor(vendor)}
                          className={`px-3 py-1 text-xs rounded-md border flex items-center gap-1 ${
                            selectedVendor && selectedVendor._id === vendor._id
                              ? 'bg-indigo-100 border-indigo-400 text-indigo-600' 
                              : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                          disabled={!vendor.isAvailable}
                        >
                          {selectedVendor && selectedVendor._id === vendor._id
                            ? 'Selected'
                            : 'Choose This Provider'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Show services from the matched service category when this vendor is selected */}
                  {selectedVendor && selectedVendor._id === vendor._id && matchedServiceCategory && (
                    <div className="mt-4 border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Available Services:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchedServiceCategory.services.map(service => (
                          <div 
                            key={service.id}
                            className={`p-2 border rounded-md ${
                              selectedService === service.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">{service.name}</p>
                                <p className="text-xs text-gray-500">
                                  ₹{service.cost} {service.unit ? `${service.unit}` : ''}
                                </p>
                              </div>
                              <motion.button
                                onClick={() => handleAddToCart(service, vendor)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                  addedItems[`${vendor._id || vendor.clerkId}-${service.id}`]
                                    ? 'bg-green-500 text-white'
                                    : 'bg-black hover:bg-gray-800 text-white'
                                }`}
                                disabled={addedItems[`${vendor._id || vendor.clerkId}-${service.id}`]}
                                whileTap={{ scale: 0.95 }}
                              >
                                {addedItems[`${vendor._id || vendor.clerkId}-${service.id}`] ? (
                                  <span className="flex items-center">
                                    <svg 
                                      className="w-3 h-3 mr-1" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    Added
                                  </span>
                                ) : "Add"}
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            ) : !loading && !error && !showVendorList && matchedServiceCategory && matchedServiceCategory.services ? (
              <div className="text-center py-4 text-gray-600">
                <p>No vendors are available for this service in your area.</p>
                <p className="mt-2">We'll notify you when providers become available.</p>
              </div>
            ) : !loading && !error && (
              <div className="text-center py-8 text-gray-500">
                No services available in this category
              </div>
            )}
          </div>

          <div className="border-t pt-4 mt-4 sticky bottom-0 bg-white z-10">
            <button
              className="w-full bg-gray-900 text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ServicePopup;