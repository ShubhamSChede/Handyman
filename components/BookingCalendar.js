import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';

const BookingCalendar = ({ bookings = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Helper to get all days in a month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc, booking) => {
    const date = new Date(booking.scheduledAt).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {});
  
  // Navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const currentYear = currentMonth.getFullYear();
  const currentMonthNum = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentMonthNum, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonthNum, currentYear);
  
  // Create calendar array
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ day: null, date: null });
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonthNum, day);
    const dateString = formatDate(date);
    const dayBookings = bookingsByDate[dateString] || [];
    calendarDays.push({
      day,
      date: dateString,
      bookings: dayBookings,
      isToday: dateString === formatDate(new Date())
    });
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-black px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Booking Calendar</h2>
      </div>
      
      <div className="p-4">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          
          <h3 className="font-medium text-gray-800">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          
          <button 
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day names */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
            <div key={dayName} className="text-center text-xs text-gray-500 font-medium py-2">
              {dayName}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((dayData, index) => (
            <div 
              key={index} 
              className={`border p-1 min-h-[70px] ${
                dayData.day === null 
                  ? 'bg-gray-50' 
                  : dayData.isToday
                    ? 'bg-blue-50'
                    : ''
              }`}
            >
              {dayData.day !== null && (
                <>
                  <div className={`text-right ${dayData.isToday ? 'font-bold text-blue-600' : ''}`}>
                    {dayData.day}
                  </div>
                  {dayData.bookings.length > 0 && (
                    <div className="mt-1">
                      {dayData.bookings.length > 2 ? (
                        <div className="text-xs p-1 bg-blue-100 text-blue-800 rounded">
                          {dayData.bookings.length} bookings
                        </div>
                      ) : (
                        dayData.bookings.map((booking, i) => (
                          <div 
                            key={i}
                            className="text-xs p-1 mb-1 truncate rounded bg-blue-100 text-blue-800"
                            title={booking.serviceType}
                          >
                            <div className="flex items-center">
                              <FiClock className="mr-1" size={10} />
                              {new Date(booking.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;