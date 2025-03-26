"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import ServicePopup from './ServicePopup';

// Define servicesData directly in the component
const servicesData = [
  {
    id: "Home-maintenance",
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
    id: "Plumbing",
    name: "Plumbing", // Matches with servicesOffered in vendor data
    services: [
      { id: "wash-basin", name: "Wash Basin Servicing", cost: 500 },
      { id: "pipe-replacement", name: "Pipe Replacement", cost: 140 },
      { id: "tile-grouting", name: "Tile Grouting", cost: 1000 },
      { id: "toilet-repair", name: "Toilet Repair", cost: 700 },
      { id: "tap-installation", name: "Tap Installation", cost: 150 },
    ],
  },
  {
    id: "Carpenter",
    name: "Carpenter", // Matches with servicesOffered in vendor data
    services: [
      { id: "bed-support", name: "Bed Support", cost: 460 },
      { id: "hinge-installation", name: "Hinge Installation", cost: 199 },
      { id: "wooden-door-repair", name: "Wooden Door Repair", cost: 300 },
      { id: "door-lock-installation", name: "Door Lock Installation", cost: 560 },
    ],
  },
  {
    id: "Ac-appliances",
    name: "Ac-appliances", // Matches with servicesOffered in vendor data
    services: [
      { id: "deep-clean", name: "Deep Clean Service", cost: 2000 },
      { id: "light-servicing", name: "Light Servicing", cost: 800 },
      { id: "cooling-repair", name: "Cooling Repair", cost: 1200 },
      { id: "water-leak", name: "Water Leak Fix", cost: 1800 },
      { id: "installation-uninstallation", name: "Installation & Uninstallation", cost: 1500 },
    ],
  },
  {
    id: "Electrician",
    name: "Electrician", // Matches with servicesOffered in vendor data
    services: [
      { id: "switchboard-installation", name: "Switchboard Installation", cost: 100 },
      { id: "fan-repair", name: "Fan Repair", cost: 400 },
      { id: "ceiling-light", name: "Ceiling Light Installation", cost: 260 },
      { id: "doorbell-installation", name: "Doorbell Installation", cost: 300 },
    ],
  },
  {
    id: "Coconut-removal",
    name: "Coconut-removal", // Matches with servicesOffered in vendor data
    services: [
      { id: "coconut-removal-service", name: "Coconut Removal", cost: 100 },
    ],
  },
];

const ServiceGrid = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Safe way to get userData from localStorage
    try {
      const storedUserData = localStorage.getItem('userData');
      console.log('storedUserData', storedUserData);
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }

    // Get saved address
    const savedAddress = localStorage.getItem("userAddress");
    if (savedAddress) {
      try {
        const addressData = JSON.parse(savedAddress);
        setUserAddress(addressData);
      } catch (e) {
        console.error("Error parsing saved address:", e);
      }
    }
    
    // Get coordinates from localStorage
    try {
      const lat = localStorage.getItem("userLatitude");
      const lng = localStorage.getItem("userLongitude");
      if (lat && lng) {
        setUserLatitude(parseFloat(lat));
        setUserLongitude(parseFloat(lng));
      }
    } catch (e) {
      console.error("Error getting coordinates from localStorage:", e);
    }
    
    // Load cart from localStorage if it exists
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing saved cart:", e);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const services = [
    {
      id: "Plumbing",
      name: "Plumbing", // Consistent with servicesData and vendor data
      icon: "/plumbing.png", 
    },
    {
      id: "Ac-appliances",
      name: "AC & Appliances", // Updated to match with servicesData
      icon: "/airconditioner.png", 
    },
    {
      id: "Carpenter",
      name: "Carpentry", // Consistent with servicesData and vendor data
      icon: "/carpenter.png", 
    },
    {
      id: "Home-maintenance",
      name: "Home Maintenance", // Consistent with servicesData and vendor data
      icon: "/cleaning.png", 
    },
    {
      id: "Electrician",
      name: "Electrical Work", // Consistent with servicesData and vendor data
      icon: "/electrician.png",
    },
    {
      id: "Coconut-removal",
      name: "Coconut Removal", // Consistent with servicesData and vendor data
      icon: "/coconut.png", 
    }
  ];

  const handleServiceClick = (serviceId) => {
    // Check if user has an address set
    if (!userAddress) {
      // If no address, redirect to location page first
      window.location.href = '/location';
      return;
    }
    
    // Find the selected service category
    const category = servicesData.find(cat => cat.id === serviceId);
    if (!category) {
      console.error(`Service category with ID ${serviceId} not found`);
      return;
    }
    
    // Save selected category to localStorage for use in results page
    localStorage.setItem("selectedCategory", JSON.stringify(category));
    
    // Get the service name that matches the vendor's servicesOffered format
    // For example, convert "ac-appliances" to "AC Appliances" to match API naming
    const serviceName = category.name;
    
    // Redirect to results page with service parameter
    window.location.href = `/results?service=${encodeURIComponent(serviceName)}`;
  };

  const closePopup = () => {
    setSelectedCategory(null);
  };

  const addToCart = (service) => {
    const existingItemIndex = cart.findIndex(item => item.id === service.id);
    
    if (existingItemIndex !== -1) {
      // Item already exists in cart, update quantity
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([...cart, { ...service, quantity: 1 }]);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="md:w-1/2 mb-6 md:mb-0">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Home services at your doorstep
      </h1>
      
      {userAddress && (
        <div className="flex items-center mb-2 text-gray-600">
          <svg 
            className="h-5 w-5 mr-2" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
          <span className="text-sm">
            Delivering to: {userAddress.location}
            {userAddress.houseNumber && `, ${userAddress.houseNumber}`}
            {userAddress.street && ` ${userAddress.street}`}
          </span>
          <button 
            onClick={() => window.location.href = '/location'}
            className="ml-2 text-black hover:text-gray-700 text-sm underline"
          >
            Change
          </button>
        </div>
      )}
      
      {userLatitude && userLongitude && (
        <div className="flex items-center mb-4 text-gray-600 text-sm">
          <svg 
            className="h-5 w-5 mr-2" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" 
            />
          </svg>
          <span>
            Coordinates: {userLatitude.toFixed(6)}°, {userLongitude.toFixed(6)}°
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search for services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-3.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg text-gray-700">What are you looking for?</p>
          
          {/* Cart button */}
          <button 
            className="flex items-center bg-blue-500 text-white px-3 py-1 rounded-lg"
            onClick={() => window.location.href = '/cart'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-semibold">{cart.reduce((total, item) => total + item.quantity, 0)}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <button 
              key={service.id} 
              onClick={() => handleServiceClick(service.id)}
              className="block bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition duration-150 text-center"
            >
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mb-2">
                  <div className="relative w-12 h-12">
                    <Image 
                      src={service.icon} 
                      alt={service.name} 
                      layout="fill" 
                      objectFit="contain"
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-800">{service.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Service popup */}
      {selectedCategory && (
        <ServicePopup 
          selectedCategory={selectedCategory} 
          onClose={closePopup} 
          addToCart={addToCart} 
        />
      )}
    </div>
  );
};

export default ServiceGrid;