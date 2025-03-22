'use client'

import React, { useEffect, useState, useRef } from 'react'
import { FiUser, FiMapPin, FiPhone, FiTag, FiClock, FiDollarSign, FiCheckCircle, FiEdit, FiCalendar } from 'react-icons/fi'
import gsap from 'gsap'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const DashboardPage = () => {
  const router = useRouter()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [availabilitySlots, setAvailabilitySlots] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isEditing, setIsEditing] = useState(false)
  const [updatedVendorData, setUpdatedVendorData] = useState({
    isAvailable: true,
    pricing: 0,
    availability: {
      startTime: '',
      endTime: ''
    },
    servicesOffered: []
  })
  const [serviceInput, setServiceInput] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [userId, setUserId] = useState(null)
  
  // References for GSAP animations
  const headerRef = useRef(null)
  const userCardRef = useRef(null)
  const statsCardRef = useRef(null)
  const activityCardRef = useRef(null)

  // First, get the user ID from localStorage
  useEffect(() => {
    // Retrieve and parse user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    const storedUserId = localStorage.getItem('userId');
    
    if (storedUserData) {
      try {
        const user = JSON.parse(storedUserData);
        setUserId(user.id);
      } catch (err) {
        console.error('Error parsing user data:', err);
        // Fallback to userId if userData parsing fails
        if (storedUserId) {
          setUserId(storedUserId);
        }
      }
    } else if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // No user data found, redirect to login
      setError('You are not logged in. Please log in to view your dashboard.');
      // Optional: Redirect to login page after a delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }, [router]);

  // Fetch vendor data once we have the user ID
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!userId) return; // Don't fetch if we don't have a user ID yet
      
      try {
        console.log(`Fetching vendor data from: http://localhost:3000/api/showVendor/${userId}`);
        
        const response = await axios.get(`http://localhost:3000/api/showVendor/${userId}`);
        console.log("Vendor data response:", response.data);
        
        if (response.data && response.data.vendor) {
          // Set vendor data
          setUserData(response.data.vendor);
          
          // Set initial form values
          setUpdatedVendorData({
            isAvailable: response.data.vendor.isAvailable !== undefined 
              ? response.data.vendor.isAvailable 
              : true,
            pricing: response.data.vendor.pricing || 0,
            availability: {
              startTime: response.data.vendor.availability?.startTime || '09:00',
              endTime: response.data.vendor.availability?.endTime || '18:00'
            },
            servicesOffered: response.data.vendor.servicesOffered || []
          });
        } else {
          throw new Error("No vendor data returned from the API");
        }
      } catch (err) {
        console.error('Error fetching vendor data:', err);
        setError('Failed to load vendor profile. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [userId]); // This effect runs when userId changes

  // Mock function for update - we're not using real updates for now
  const handleUpdateVendor = async () => {
    try {
      setError(null);
      
      // Just simulate a successful update
      console.log("Would update vendor with data:", updatedVendorData);
      
      // Update the UI with the new data (without actually making an API call)
      setUserData(prevData => ({
        ...prevData,
        ...updatedVendorData
      }));
      
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating vendor:', err);
      setError('Failed to update your profile. Please try again.');
    }
  };
  
  const handleAddService = () => {
    if (serviceInput.trim() !== '' && !updatedVendorData.servicesOffered.includes(serviceInput.trim())) {
      setUpdatedVendorData({
        ...updatedVendorData,
        servicesOffered: [...updatedVendorData.servicesOffered, serviceInput.trim()]
      });
      setServiceInput('');
    }
  };
  
  const handleRemoveService = (service) => {
    setUpdatedVendorData({
      ...updatedVendorData,
      servicesOffered: updatedVendorData.servicesOffered.filter(s => s !== service)
    });
  };

  // GSAP animations
  useEffect(() => {
    if (!loading && !error && userData) {
      // Animate header
      gsap.from(headerRef.current, {
        y: -50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      })

      // Animate cards with stagger
      gsap.from([userCardRef.current, statsCardRef.current], {
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
      })

      // Animate activity section if it exists
      if (activityCardRef.current) {
        gsap.from(activityCardRef.current, {
          y: 100,
          opacity: 0,
          duration: 0.8,
          delay: 0.6,
          ease: "power3.out"
        })
      }
    }
  }, [loading, error, userData])

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
    </div>
  )
  
  if (error) return (
    <div className="bg-gray-100 border border-gray-300 text-gray-800 px-4 py-3 rounded-lg mx-auto max-w-lg mt-8">
      <p className="font-medium">Error loading dashboard</p>
      <p className="text-sm">{error}</p>
      {!userId && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => router.push('/login')}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  )
  
  if (!userData) return (
    <div className="bg-gray-100 border border-gray-300 text-gray-800 px-4 py-3 rounded-lg mx-auto max-w-lg mt-8">
      <p className="text-center">No vendor data found.</p>
      {userId && (
        <p className="text-sm text-center mt-2">
          Attempting to fetch data for vendor ID: {userId}
        </p>
      )}
    </div>
  )

  // The rest of your component remains the same...
  return (
    <div className="p-6 max-w-6xl mx-auto bg-white">
      {/* Header */}
      <div ref={headerRef} className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {userData.name}!
        </h1>
        <div className="mt-2 sm:mt-0 bg-gray-100 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
          Vendor Account
        </div>
      </div>
      
      {updateSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <FiCheckCircle className="mr-2" />
          Profile updated successfully!
        </div>
      )}
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information Card */}
        <div ref={userCardRef} className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-black px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Vendor Information</h2>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="text-white hover:text-gray-300 transition-colors"
            >
              <FiEdit className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <FiUser className="text-black mr-3" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{userData.name}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <FiMapPin className="text-black mr-3" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">
                  {userData.location ? 
                    `Lat: ${userData.location.coordinates[1].toFixed(4)}, Lng: ${userData.location.coordinates[0].toFixed(4)}` : 
                    'Not provided'}
                </p>
              </div>
            </div>
            
            {!isEditing && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Vendor Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <FiTag className="text-gray-800 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Services</p>
                      <p className="font-medium">{userData.servicesOffered?.join(', ') || 'None'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FiDollarSign className="text-gray-800 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Pricing</p>
                      <p className="font-medium">{userData.pricing ? `₹${userData.pricing}/hour` : 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center md:col-span-2">
                    <FiClock className="text-gray-800 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Availability</p>
                      <p className="font-medium">{
                        userData.availability?.startTime && userData.availability?.endTime ? 
                        `${userData.availability.startTime} to ${userData.availability.endTime}` : 
                        'Not set'
                      }</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center md:col-span-2">
                    <div className={`px-3 py-1 rounded-full ${userData.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {userData.isAvailable ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Vendor Edit Form */}
            {isEditing && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Edit Vendor Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Availability Status
                    </label>
                    <div className="flex space-x-4">
                      <button 
                        type="button"
                        className={`px-4 py-2 rounded-md border ${
                          updatedVendorData.isAvailable ? 
                          'bg-green-100 border-green-500 text-green-800' : 
                          'bg-white border-gray-300 text-gray-700'
                        }`}
                        onClick={() => setUpdatedVendorData({...updatedVendorData, isAvailable: true})}
                      >
                        Available
                      </button>
                      <button 
                        type="button"
                        className={`px-4 py-2 rounded-md border ${
                          !updatedVendorData.isAvailable ? 
                          'bg-red-100 border-red-500 text-red-800' : 
                          'bg-white border-gray-300 text-gray-700'
                        }`}
                        onClick={() => setUpdatedVendorData({...updatedVendorData, isAvailable: false})}
                      >
                        Unavailable
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={updatedVendorData.pricing}
                      onChange={(e) => setUpdatedVendorData({
                        ...updatedVendorData, 
                        pricing: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Working Hours
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                        <input
                          type="time"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={updatedVendorData.availability.startTime}
                          onChange={(e) => setUpdatedVendorData({
                            ...updatedVendorData, 
                            availability: {
                              ...updatedVendorData.availability,
                              startTime: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Time</label>
                        <input
                          type="time"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={updatedVendorData.availability.endTime}
                          onChange={(e) => setUpdatedVendorData({
                            ...updatedVendorData, 
                            availability: {
                              ...updatedVendorData.availability,
                              endTime: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Services Offered
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Add a service..."
                        className="w-full p-2 border border-gray-300 rounded-l-md"
                        value={serviceInput}
                        onChange={(e) => setServiceInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddService()}
                      />
                      <button
                        type="button"
                        onClick={handleAddService}
                        className="px-4 py-2 bg-black text-white rounded-r-md hover:bg-gray-800"
                      >
                        Add
                      </button>
                    </div>
                    
                    {updatedVendorData.servicesOffered.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {updatedVendorData.servicesOffered.map((service, index) => (
                          <div 
                            key={index} 
                            className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center"
                          >
                            <span>{service}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(service)}
                              className="ml-2 text-gray-500 hover:text-gray-700"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3 pt-3">
                    <button
                      type="button"
                      onClick={handleUpdateVendor}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats Card */}
        <div ref={statsCardRef} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-black px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Account Summary</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userData.bookedSlots?.length || 0}
                </div>
                <div className="text-sm text-gray-600">
                  Bookings
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userData.reviews && userData.reviews.length > 0 
                    ? (userData.reviews.reduce((sum, review) => sum + review.rating, 0) / userData.reviews.length).toFixed(1) 
                    : '--'}
                </div>
                <div className="text-sm text-gray-600">
                  Rating
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-gray-600 mb-2 font-medium">Quick Actions</h3>
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-md transition-colors mb-2">
                Update Availability
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews Section for Vendors */}
      {userData.reviews && userData.reviews.length > 0 && (
        <div ref={activityCardRef} className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-black px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Customer Reviews</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {userData.reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* If no reviews */}
      {(!userData.reviews || userData.reviews.length === 0) && (
        <div ref={activityCardRef} className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-black px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Customer Reviews</h2>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <p>No reviews yet.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage