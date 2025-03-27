import React, { useState, useEffect } from 'react';
import { FiClock, FiUser, FiMapPin, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import axios from 'axios';

const VendorBookings = ({ vendorId }) => {
  const [bookings, setBookings] = useState([]);
  const [bookingsByDate, setBookingsByDate] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    canceled: 0,
    upcoming: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch bookings when component mounts
  useEffect(() => {
    fetchBookings();
  }, [vendorId, statusFilter, dateRange]);

  const fetchBookings = async () => {
    if (!vendorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      let url = `/api/vendor/bookings?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (dateRange.startDate) url += `startDate=${dateRange.startDate}&`;
      if (dateRange.endDate) url += `endDate=${dateRange.endDate}&`;
      
      // Get the phone number from localStorage for authentication
      const phoneNumber = localStorage.getItem("userPhoneNumber");
      
      if (!phoneNumber) {
        throw new Error("Authentication required. Please log in again.");
      }
      
      const response = await axios.get(url, {
        headers: {
          'x-phone-number': phoneNumber
        }
      });
      
      setBookings(response.data.bookings || []);
      setBookingsByDate(response.data.bookingsByDate || {});
      setStats(response.data.stats || {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        canceled: 0,
        upcoming: 0,
        totalRevenue: 0
      });
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle booking status update
  const handleUpdateStatus = async (bookingId, newStatus) => {
    setActionLoading(true);
    
    try {
      const phoneNumber = localStorage.getItem("userPhoneNumber");
      
      if (!phoneNumber) {
        throw new Error("Authentication required. Please log in again.");
      }
      
      await axios.patch(`/api/vendor/bookings/${bookingId}`, 
        { status: newStatus },
        {
          headers: {
            'x-phone-number': phoneNumber,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Show success message
      setSuccessMessage(`Booking ${newStatus} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Update the booking in state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === bookingId 
            ? {...booking, status: newStatus} 
            : booking
        )
      );
      
      // Refresh bookings to update stats
      fetchBookings();
      
    } catch (err) {
      console.error(`Error updating booking status:`, err);
      setError(`Failed to update status. ${err.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(false);
      setShowConfirmation(false);
      setSelectedBooking(null);
    }
  };

  // Open confirmation modal
  const openConfirmation = (booking, action) => {
    setSelectedBooking(booking);
    setActionType(action);
    setShowConfirmation(true);
  };

  // Close confirmation modal
  const closeConfirmation = () => {
    setShowConfirmation(false);
    setSelectedBooking(null);
  };

  // Get appropriate color for status
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-black px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Bookings</h2>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="m-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
          <FiCheckCircle className="mr-2" />
          {successMessage}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Stats */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-xl font-bold text-blue-600">{stats.upcoming}</div>
            <div className="text-xs text-gray-500">Upcoming</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-xl font-bold text-gray-800">₹{stats.totalRevenue}</div>
            <div className="text-xs text-gray-500">Revenue</div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Filter by Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm w-full md:w-auto"
            >
              <option value="">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="p-2 border border-gray-300 rounded-md text-sm w-full md:w-auto"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="p-2 border border-gray-300 rounded-md text-sm w-full md:w-auto"
            />
          </div>
          <div className="md:self-end">
            <button
              onClick={() => {
                setStatusFilter('');
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="p-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Bookings List */}
      <div className="p-4">
        {bookings.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>No bookings found.</p>
            {(statusFilter || dateRange.startDate || dateRange.endDate) && (
              <p className="mt-2 text-sm">Try clearing your filters.</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(bookingsByDate).sort((a, b) => new Date(a) - new Date(b)).map(date => (
              <div key={date} className="mb-6">
                <h3 className="font-semibold mb-2 text-gray-600 flex items-center">
                  <FiCalendar className="mr-2" />
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <div className="space-y-3">
                  {bookingsByDate[date].map(booking => (
                    <div 
                      key={booking._id} 
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center mb-2">
                              <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </div>
                              {booking.isToday && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Today
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium">{booking.serviceType}</h4>
                            <div className="flex items-center text-gray-500 text-sm mt-1">
                              <FiClock className="mr-1" />
                              {booking.formattedTime} • ₹{booking.price}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{booking.userId?.name || "Unknown Customer"}</div>
                            <div className="text-sm text-gray-500">{booking.userId?.phoneNumber || ""}</div>
                          </div>
                        </div>
                        
                        {booking.userId?.address && (
                          <div className="mt-3 text-sm flex items-start text-gray-600">
                            <FiMapPin className="mr-1 mt-0.5 flex-shrink-0" />
                            <span>{booking.userId.address}</span>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openConfirmation(booking, 'confirm')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => openConfirmation(booking, 'cancel')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          
                          {booking.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => openConfirmation(booking, 'complete')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                              >
                                Mark Complete
                              </button>
                              <button
                                onClick={() => openConfirmation(booking, 'cancel')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          
                          {booking.status === 'completed' && (
                            <span className="text-sm text-green-600 flex items-center">
                              <FiCheckCircle className="mr-1" /> Completed
                            </span>
                          )}
                          
                          {booking.status === 'canceled' && (
                            <span className="text-sm text-red-600 flex items-center">
                              <FiXCircle className="mr-1" /> Canceled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmation && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">
              {actionType === 'confirm' && "Confirm Booking"}
              {actionType === 'complete' && "Mark as Completed"}
              {actionType === 'cancel' && "Cancel Booking"}
            </h3>
            <p className="text-gray-600 mb-6">
              {actionType === 'confirm' && "Are you sure you want to confirm this booking?"}
              {actionType === 'complete' && "Are you sure you want to mark this booking as completed?"}
              {actionType === 'cancel' && "Are you sure you want to cancel this booking? This action cannot be undone."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirmation}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                No, Go Back
              </button>
              <button
                onClick={() => {
                  if (actionType === 'confirm') handleUpdateStatus(selectedBooking._id, 'confirmed');
                  if (actionType === 'complete') handleUpdateStatus(selectedBooking._id, 'completed');
                  if (actionType === 'cancel') handleUpdateStatus(selectedBooking._id, 'canceled');
                }}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-md text-white ${
                  actionType === 'cancel' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : actionType === 'complete'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {actionLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </div>
                ) : (
                  <>Yes, I'm Sure</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorBookings;