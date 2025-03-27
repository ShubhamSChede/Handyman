import { NextResponse } from "next/server";
import { connect } from "../../../../config/dbConfig";
import User from "../../../../models/user.model";
import Booking from "../../../../models/booking.model";

export async function GET(request, { params }) {
  const vendorId = params.vendorId;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!vendorId || !date) {
    return NextResponse.json(
      { error: "Vendor ID and date are required" },
      { status: 400 }
    );
  }

  try {
    await connect();

    // Find the vendor to get working hours
    const vendor = await User.findById(vendorId);
    
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Get vendor's working hours
    const start = vendor.availability?.startTime || "09:00";
    const end = vendor.availability?.endTime || "18:00";
    
    // Generate all possible time slots based on working hours
    // Using 2-hour slots, but this can be configured
    const allPossibleSlots = generateTimeSlots(start, end);
    
    // Find the vendor's booked slots for this date
    const bookedSlots = vendor.bookedSlots
      .filter(slot => slot.date === date)
      .map(slot => slot.time);
    
    // Filter out the booked slots to get available slots
    const availableSlots = allPossibleSlots.filter(
      slot => !bookedSlots.includes(slot)
    );

    return NextResponse.json({
      workingHours: {
        start,
        end
      },
      availableSlots,
      bookedSlotsCount: bookedSlots.length
    });

  } catch (error) {
    console.error("Error fetching vendor availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor availability" },
      { status: 500 }
    );
  }
}

// Helper function to generate time slots
function generateTimeSlots(start, end) {
  const slots = [];
  const startHour = parseInt(start.split(':')[0]);
  const startMinute = parseInt(start.split(':')[1]);
  const endHour = parseInt(end.split(':')[0]);
  const endMinute = parseInt(end.split(':')[1]);
  
  // Convert to minutes for easier calculation
  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // Generate 2-hour slots
  const slotDuration = 120; // 2 hours in minutes
  
  while (currentMinutes + slotDuration <= endMinutes) {
    // Format current time
    const startTimeHour = Math.floor(currentMinutes / 60);
    const startTimeMinute = currentMinutes % 60;
    
    // Format end time for this slot
    const endTimeMinutes = currentMinutes + slotDuration;
    const endTimeHour = Math.floor(endTimeMinutes / 60);
    const endTimeMinute = endTimeMinutes % 60;
    
    // Format as HH:MM-HH:MM
    const slot = `${String(startTimeHour).padStart(2, '0')}:${String(startTimeMinute).padStart(2, '0')}-${String(endTimeHour).padStart(2, '0')}:${String(endTimeMinute).padStart(2, '0')}`;
    
    slots.push(slot);
    
    // Move to next slot (could be configured to be smaller increments)
    currentMinutes += slotDuration;
  }
  
  return slots;
}
