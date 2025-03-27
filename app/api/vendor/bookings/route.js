import { NextResponse } from "next/server";
import { connect } from "../../../../config/dbConfig";
import User from "../../../../models/user.model";
import Booking from "../../../../models/booking.model";
import { authenticateUser } from "../../../../middleware/authMiddleware";

export async function GET(request) {
  try {
    // Connect to database
    await connect();
    
    // Get phone number from request headers for authentication
    const phoneNumber = request.headers.get('x-phone-number');
    if (!phoneNumber) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Find the vendor by phone number
    const vendor = await User.findOne({ phoneNumber });
    
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    
    if (vendor.role !== "vendor") {
      return NextResponse.json({ 
        error: "Access denied. Only vendors can access this information." 
      }, { status: 403 });
    }
    
    const vendorId = vendor._id;
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional filter by status
    const startDate = searchParams.get('startDate'); // Optional filter by date range
    const endDate = searchParams.get('endDate');
    
    // Build the query filter
    const filter = { vendorId };
    
    // Add status filter if provided
    if (status && ['pending', 'confirmed', 'completed', 'canceled'].includes(status)) {
      filter.status = status;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.scheduledAt = {};
      if (startDate) filter.scheduledAt.$gte = new Date(startDate);
      if (endDate) {
        // Set to end of the day for the end date
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.scheduledAt.$lte = endOfDay;
      }
    }
    
    // Fetch bookings with populated user information (but hide sensitive data)
    const bookings = await Booking.find(filter)
      .populate({
        path: 'userId',
        select: 'name phoneNumber address landmark' // Only select non-sensitive fields
      })
      .sort({ scheduledAt: 1 }) // Sort by scheduled date, earliest first
      .lean(); // Convert to plain JavaScript objects for better performance
    
    // Add custom fields to each booking for better display
    const enhancedBookings = bookings.map(booking => {
      // Calculate some useful display values
      const scheduledDate = new Date(booking.scheduledAt);
      const isPast = scheduledDate < new Date();
      
      return {
        ...booking,
        formattedDate: scheduledDate.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        formattedTime: scheduledDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isPast,
        // Add a flag for bookings happening today
        isToday: new Date(scheduledDate).setHours(0,0,0,0) === new Date().setHours(0,0,0,0),
        // Add any other useful derived properties
      };
    });
    
    // Group bookings by date for easier frontend display
    const bookingsByDate = {};
    enhancedBookings.forEach(booking => {
      const dateKey = new Date(booking.scheduledAt).toISOString().split('T')[0];
      if (!bookingsByDate[dateKey]) {
        bookingsByDate[dateKey] = [];
      }
      bookingsByDate[dateKey].push(booking);
    });
    
    // Return statistics along with the bookings
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      canceled: bookings.filter(b => b.status === 'canceled').length,
      upcoming: bookings.filter(b => new Date(b.scheduledAt) > new Date()).length,
      totalRevenue: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.price || 0), 0)
    };
    
    return NextResponse.json({
      bookings: enhancedBookings,
      bookingsByDate,
      stats
    });
    
  } catch (error) {
    console.error("Error fetching vendor bookings:", error);
    return NextResponse.json({ 
      error: "Failed to fetch bookings", 
      details: error.message 
    }, { status: 500 });
  }
}