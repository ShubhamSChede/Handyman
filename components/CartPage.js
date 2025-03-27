"use client";
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import axios from 'axios';
import { format } from 'date-fns';

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [userAddress, setUserAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Add states for vendor availability
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availabilityData, setAvailabilityData] = useState({});
  const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  
  // Refs for GSAP animations
  const pageRef = useRef(null);
  const addressRef = useRef(null);
  const cartItemsRef = useRef(null);
  const summaryRef = useRef(null);
  const buttonsRef = useRef(null);
  const cartItemRefs = useRef([]);

  useEffect(() => {
    // Simulate loading data
    setIsLoading(true);
    setTimeout(() => {
      // Load cart from localStorage
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Error parsing saved cart:", e);
        }
      }

      // Load user address
      const savedAddress = localStorage.getItem("userAddress");
      if (savedAddress) {
        try {
          setUserAddress(JSON.parse(savedAddress));
        } catch (e) {
          console.error("Error parsing saved address:", e);
        }
      }
      setIsLoading(false);
    }, 600);
  }, []);
  
  // Fetch vendor availability when cart or selected date changes
  useEffect(() => {
    const fetchVendorAvailability = async () => {
      if (!cart || cart.length === 0) return;
      
      setLoadingAvailability(true);
      setAvailabilityError(null);
      
      try {
        // Group by vendor to avoid redundant API calls
        const uniqueVendors = [...new Set(cart.map(item => item.vendorId))];
        
        // Create a new object to store availability data
        const newAvailabilityData = {};
        const newSelectedTimeSlots = {...selectedTimeSlots};
        
        // Fetch availability for each unique vendor
        for (const vendorId of uniqueVendors) {
          if (!vendorId) continue;
          
          try {
            // Using relative URL for better compatibility
            const response = await axios.get(
              `/api/availability/${vendorId}?date=${selectedDate}`
            );
            
            // Log response for debugging
            console.log(`Availability data for vendor ${vendorId}:`, response.data);
            
            // Make sure we have valid data with available slots
            if (response.data && Array.isArray(response.data.availableSlots)) {
              newAvailabilityData[vendorId] = response.data;
              
              // The available slots array should already exclude booked slots
              // Now handle selection of a slot
              const availableSlots = response.data.availableSlots;
              const currentSlot = selectedTimeSlots[vendorId];
              
              if (!currentSlot || !availableSlots.includes(currentSlot)) {
                // If we have available slots, select the first one
                if (availableSlots.length > 0) {
                  newSelectedTimeSlots[vendorId] = availableSlots[0];
                } else {
                  // Otherwise clear the selection
                  newSelectedTimeSlots[vendorId] = "";
                }
              }
            } else {
              console.error("Invalid availability data for vendor:", vendorId, response.data);
              newAvailabilityData[vendorId] = { 
                availableSlots: [], 
                workingHours: { start: "09:00", end: "18:00" }
              };
              newSelectedTimeSlots[vendorId] = "";
            }
          } catch (error) {
            console.error(`Error fetching availability for vendor ${vendorId}:`, error);
            newAvailabilityData[vendorId] = { 
              availableSlots: [], 
              workingHours: { start: "09:00", end: "18:00" }
            };
            newSelectedTimeSlots[vendorId] = "";
          }
        }
        
        setAvailabilityData(newAvailabilityData);
        setSelectedTimeSlots(newSelectedTimeSlots);
      } catch (error) {
        console.error("Error fetching vendor availability:", error);
        setAvailabilityError("Failed to fetch vendor availability. Please try again.");
      } finally {
        setLoadingAvailability(false);
      }
    };
    
    if (cart.length > 0) {
      fetchVendorAvailability();
    }
  }, [cart, selectedDate]);

  // Run animations when components mount
  useEffect(() => {
    if (!isLoading && cart.length > 0) {
      // Fade in main container
      gsap.fromTo(
        pageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5 }
      );

      // Animate sections with staggered delay
      const sections = [
        addressRef.current,
        cartItemsRef.current,
        summaryRef.current,
        buttonsRef.current
      ].filter(Boolean);

      gsap.fromTo(
        sections,
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.5, 
          stagger: 0.1,
          ease: "power1.out"
        }
      );

      // Animate cart items
      if (cartItemRefs.current.length > 0) {
        gsap.fromTo(
          cartItemRefs.current,
          { opacity: 0, y: 15 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.3, 
            stagger: 0.1,
            ease: "power1.out",
            delay: 0.3
          }
        );
      }
    }
  }, [isLoading, cart.length]);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const increaseQuantity = (index) => {
    const newCart = [...cart];
    newCart[index].quantity += 1;
    updateCart(newCart);
  };

  const decreaseQuantity = (index) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
      updateCart(newCart);
    } else {
      removeItem(index);
    }
  };

  const removeItem = (index) => {
    // Animate item removal
    if (cartItemRefs.current[index]) {
      gsap.to(cartItemRefs.current[index], {
        opacity: 0,
        height: 0,
        marginBottom: 0,
        padding: 0,
        duration: 0.3,
        onComplete: () => {
          const newCart = cart.filter((_, i) => i !== index);
          updateCart(newCart);
          // Reset refs array after removing item
          cartItemRefs.current = cartItemRefs.current.filter((_, i) => i !== index);
        }
      });
    } else {
      const newCart = cart.filter((_, i) => i !== index);
      updateCart(newCart);
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.cost * item.quantity), 0);
    return subtotal;
  };
  
  // Handle time slot selection
  const handleTimeSlotChange = (vendorId, timeSlot) => {
    setSelectedTimeSlots(prev => ({
      ...prev,
      [vendorId]: timeSlot
    }));
  };
  
  // Function to format date for display
  const formatDateForDisplay = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Check if all items have a selected time slot
  const allItemsHaveTimeSlots = () => {
    if (cart.length === 0) return false;
    
    return cart.every(item => {
      const vendorId = item.vendorId;
      if (!vendorId) return true; // Skip check for items without a vendor ID
      
      // Check if we have a non-empty time slot selected and available slots exist
      return (
        selectedTimeSlots[vendorId] && 
        selectedTimeSlots[vendorId] !== "" &&
        availabilityData[vendorId]?.availableSlots?.length > 0
      );
    });
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Store final total before checkout
      const finalTotal = calculateTotal() + 99;
      localStorage.setItem("cartTotal", finalTotal.toString());
      
      // Get the user's phone number from localStorage
      const phoneNumber = localStorage.getItem("phoneNumber") || 
                          localStorage.getItem("userPhoneNumber") ||
                          localStorage.getItem("phone") ||
                          (userAddress && userAddress.phoneNumber);
      
      // For testing purposes, you can use a hardcoded phone number if nothing is found
      const finalPhoneNumber = phoneNumber || "+919421247688"; // Fallback for testing
      
      console.log("Using phone number for API calls:", finalPhoneNumber);
      
      if (!finalPhoneNumber) {
        throw new Error("User not authenticated. Please log in again.");
      }
      
      // For each item in the cart, send a booking request
      const bookingPromises = cart.map(async (item) => {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Use selected time slot or default
        const timeSlot = selectedTimeSlots[item.vendorId] || "09:00-11:00";
        
        const bookingData = {
          vendorId: item.vendorId,
          serviceType: item.serviceId || item.name,
          price: item.cost * item.quantity,
          date: selectedDate || today,
          timeSlot: timeSlot
        };
        
        console.log("Sending booking request:", bookingData);
        
        // Make the API call with phone number in header
        const response = await axios.post('/api/book', bookingData, {
          headers: {
            'x-phone-number': finalPhoneNumber,
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      });
      
      // Wait for all booking requests to complete
      const results = await Promise.all(bookingPromises);
      console.log("Booking results:", results);
      
      // Store booking results in localStorage for reference on payment page
      localStorage.setItem("bookingResults", JSON.stringify(results));
      
      // Clear the cart after successful booking
      localStorage.removeItem("cart");
      
      // Redirect to payment page
      window.location.href = '/pay';
      
    } catch (error) {
      console.error("Error during checkout:", error);
      
      // Format error message appropriately
      let errorMessage = "There was an error processing your checkout. Please try again.";
      
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Unable to connect to the booking service. Please check your internet connection.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setSubmitError(errorMessage);
      
      // Scroll to the top to show the error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Button animation functions
  const animateButtonHover = (e) => {
    gsap.to(e.currentTarget, { scale: 1.03, duration: 0.2 });
  };

  const animateButtonLeave = (e) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.2 });
  };

  const animateButtonClick = (e) => {
    gsap.timeline()
      .to(e.currentTarget, { scale: 0.97, duration: 0.1 })
      .to(e.currentTarget, { scale: 1, duration: 0.1, delay: 0.1 });
  };
  
  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center h-screen">
        <svg className="w-16 h-16 animate-spin text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-gray-600">Loading your cart...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div ref={pageRef} className="container mx-auto px-4 py-12 opacity-0">
        <h1 className="text-3xl font-bold mb-8 text-center">Your Cart</h1>
        <div ref={addressRef} className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-auto">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.70711 15.2929C4.07714 15.9229 4.52331 17 5.41421 17H17M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-gray-600 mb-6 text-lg">Your cart is empty</p>
          <button 
            onMouseEnter={animateButtonHover}
            onMouseLeave={animateButtonLeave}
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
          >
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="container mx-auto px-4 py-8 max-w-2xl opacity-0">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Cart</h1>
      
      {/* Show submit error if any */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
          </svg>
          <p>{submitError}</p>
        </div>
      )}
      
      {/* Availability error */}
      {availabilityError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6 flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1 8a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
          </svg>
          <p>{availabilityError}</p>
        </div>
      )}
      
      {/* Date selection */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="font-medium text-lg mb-3">Select Service Date</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          min={format(new Date(), 'yyyy-MM-dd')}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-600 mt-2">
          Selected date: {formatDateForDisplay(selectedDate)}
        </p>
      </div>
      
      {userAddress && (
        <div ref={addressRef} className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-start">
            <svg 
              className="h-6 w-6 mt-0.5 mr-3 text-blue-600" 
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
            <div>
              <h3 className="font-medium text-lg">Delivery Address</h3>
              <p className="text-gray-600">
                {userAddress.location}
                {userAddress.houseNumber && `, ${userAddress.houseNumber}`}
                {userAddress.street && ` ${userAddress.street}`}
              </p>
              <button 
                onMouseEnter={animateButtonHover}
                onMouseLeave={animateButtonLeave}
                onClick={() => window.location.href = '/location'}
                className="text-blue-600 text-sm font-medium mt-2 hover:underline focus:outline-none"
              >
                Change Address
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div ref={cartItemsRef} className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="font-medium text-gray-700">Cart Items ({cart.length})</h2>
        </div>
        
        <div>
          {cart.map((item, index) => (
            <div 
              key={index}
              ref={el => cartItemRefs.current[index] = el}
              className="p-4 border-b last:border-b-0"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium ">{item.name}</h3>
                    <p className="text-gray-600">₹{item.cost} {item.unit && `(${item.unit})`}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button 
                      onMouseEnter={animateButtonHover}
                      onMouseLeave={animateButtonLeave}
                      onClick={(e) => {
                        animateButtonClick(e);
                        decreaseQuantity(index);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                    <span className="w-8 h-8 flex items-center justify-center font-medium">
                      {item.quantity}
                    </span>
                    <button 
                      onMouseEnter={animateButtonHover}
                      onMouseLeave={animateButtonLeave}
                      onClick={(e) => {
                        animateButtonClick(e);
                        increaseQuantity(index);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <button 
                    onMouseEnter={animateButtonHover}
                    onMouseLeave={animateButtonLeave}
                    onClick={(e) => {
                      animateButtonClick(e);
                      removeItem(index);
                    }}
                    className="ml-4 text-red-500 p-1 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Time slot selection */}
              {item.vendorId && availabilityData[item.vendorId] && (
                <div className="mt-3 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 font-medium">Select Time Slot:</label>
                    {loadingAvailability && (
                      <div className="flex items-center text-xs text-blue-500">
                        <svg className="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading slots...
                      </div>
                    )}
                  </div>
                  
                  {availabilityData[item.vendorId].availableSlots && 
                   availabilityData[item.vendorId].availableSlots.length > 0 ? (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">
                          {availabilityData[item.vendorId].availableSlots.length} time slot(s) available
                        </span>
                      </div>
                      <select
                        value={selectedTimeSlots[item.vendorId] || ''}
                        onChange={(e) => handleTimeSlotChange(item.vendorId, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>Select a time slot</option>
                        {availabilityData[item.vendorId].availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Working hours: {availabilityData[item.vendorId].workingHours?.start || "09:00"} - {availabilityData[item.vendorId].workingHours?.end || "18:00"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 mt-1">
                      All time slots are booked for this date. Please select another date.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div ref={summaryRef} className="bg-white rounded-lg shadow-md p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Subtotal</span>
          <span>₹{calculateTotal()}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Service Fee</span>
          <span>₹99</span>
        </div>
        <div className="border-t pt-3 mt-3 flex justify-between items-center font-bold text-lg">
          <span>Total</span>
          <span className="text-blue-600">₹{calculateTotal() + 99}</span>
        </div>
      </div>
      
      <div ref={buttonsRef} className="space-y-4">
        <button 
          onMouseEnter={animateButtonHover}
          onMouseLeave={animateButtonLeave}
          onClick={(e) => {
            animateButtonClick(e);
            handleCheckout();
          }}
          disabled={isSubmitting || !allItemsHaveTimeSlots()}
          className={`w-full py-4 rounded-lg font-medium shadow-md flex items-center justify-center ${
            isSubmitting || !allItemsHaveTimeSlots()
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-slate-600 hover:bg-slate-700'
          } text-white transition-colors`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : !allItemsHaveTimeSlots() ? (
            "Please select time slots for all services"
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                <path d="M17 8L21 12M21 12L17 16M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Proceed to Checkout
            </>
          )}
        </button>
        
        <button 
          onMouseEnter={animateButtonHover}
          onMouseLeave={animateButtonLeave}
          onClick={(e) => {
            animateButtonClick(e);
            window.location.href = '/search';
          }}
          disabled={isSubmitting}
          className={`w-full py-4 rounded-lg font-medium flex items-center justify-center ${
            isSubmitting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          } transition-colors`}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Continue Shopping
        </button>
      </div>
      
      {/* Add decorative SVG background element */}
      <div className="fixed -z-10 bottom-0 left-0 w-full opacity-5 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,800 C200,1000 800,1000 1000,800 C1000,600 1000,200 1000,0 C800,200 200,200 0,0 C0,200 0,600 0,800 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
};

export default CartPage;