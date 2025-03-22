// app/api/availability/[vendorId]/route.js
import { NextResponse } from "next/server";
import { connect } from "../../../../config/dbConfig";
import User from "../../../../models/user.model";

export async function GET(req, { params }) {
  try {
    await connect();
    const { vendorId } = params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!vendorId || !date) {
      return NextResponse.json({ error: "Vendor ID and date required" }, { status: 400 });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== "vendor" || !vendor.isAvailable) {
      return NextResponse.json({ error: "Vendor not found or unavailable" }, { status: 404 });
    }

    // Generate time slots based on vendor's availability
    const startTime = parseInt(vendor.availability.startTime.split(":")[0]);
    const endTime = parseInt(vendor.availability.endTime.split(":")[0]);
    
    let slots = [];
    for (let hour = startTime; hour < endTime; hour++) {
      let slot = `${hour.toString().padStart(2, "0")}:00-${(hour + 1).toString().padStart(2, "0")}:00`;
      slots.push(slot);
    }

    // Filter out booked slots
    const bookedSlots = vendor.bookedSlots.filter(s => s.date === date).map(s => s.time);
    const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));

    return NextResponse.json({ 
      vendorId,
      date,
      availableSlots,
      workingHours: {
        start: vendor.availability.startTime,
        end: vendor.availability.endTime
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
