import { NextResponse } from "next/server";
import { connect } from "../../../../../config/dbConfig";
import User from "../../../../../models/user.model";
import Booking from "../../../../../models/booking.model";

export async function PATCH(request, { params }) {
  try {
    const bookingId = params.id;
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }
    
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
        error: "Access denied. Only vendors can update booking status." 
      }, { status: 403 });
    }
    
    const vendorId = vendor._id;
    
    // Get the booking data
    const { status } = await request.json();
    
    if (!status || !['pending', 'confirmed', 'completed', 'canceled'].includes(status)) {
      return NextResponse.json({ 
        error: "Valid status is required (pending, confirmed, completed, or canceled)" 
      }, { status: 400 });
    }
    
    // Find the booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    
    // Verify the booking belongs to this vendor
    if (booking.vendorId.toString() !== vendorId.toString()) {
      return NextResponse.json({ 
        error: "Access denied. You can only update your own bookings." 
      }, { status: 403 });
    }
    
    // Update the booking status
    booking.status = status;
    
    // If marking as completed, add completion date
    if (status === 'completed') {
      booking.completedAt = new Date();
    }
    
    await booking.save();
    
    // If the booking is canceled, we may want to free up the vendor's schedule
    if (status === 'canceled') {
      // Extract date and time from scheduledAt
      const scheduledDate = new Date(booking.scheduledAt);
      const date = scheduledDate.toISOString().split('T')[0];
      const hours = scheduledDate.getHours().toString().padStart(2, '0');
      const minutes = scheduledDate.getMinutes().toString().padStart(2, '0');
      const timeStart = `${hours}:${minutes}`;
      
      // Find and remove the booking slot if it exists in the vendor's bookedSlots
      if (vendor.bookedSlots && Array.isArray(vendor.bookedSlots)) {
        vendor.bookedSlots = vendor.bookedSlots.filter(slot => {
          // Check if this is the slot to remove
          // We need to be careful as the time format might differ slightly
          return !(slot.date === date && slot.time.startsWith(timeStart));
        });
        
        await vendor.save();
      }
    }
    
    return NextResponse.json({
      message: "Booking updated successfully",
      booking: {
        _id: booking._id,
        status: booking.status,
        updatedAt: booking.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ 
      error: "Failed to update booking", 
      details: error.message 
    }, { status: 500 });
  }
}