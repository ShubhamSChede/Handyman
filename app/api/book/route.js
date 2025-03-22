// app/api/book/route.js
import { NextResponse } from "next/server";
import { connect } from "../../../config/dbConfig";
import User from "../../../models/user.model";
import { authenticateUser } from "../../../middleware/authMiddleware";
import Booking from "../../../models/booking.model";

export async function POST(request) {
  try {
    await connect();
    const auth = await authenticateUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { vendorId, serviceType, price, date, timeSlot } = await request.json();
    if (!vendorId || !serviceType || !price || !date || !timeSlot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findById(auth.userId);
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== "vendor" || !vendor.isAvailable) {
      return NextResponse.json({ error: "Vendor not available" }, { status: 404 });
    }

    const isSlotBooked = vendor.bookedSlots.some(
      (slot) => slot.date === date && slot.time === timeSlot
    );
    if (isSlotBooked) {
      return NextResponse.json({ error: "Time slot already booked" }, { status: 409 });
    }

    const newBooking = await Booking.create({
      userId: user._id,
      vendorId,
      serviceType,
      price,
      scheduledAt: new Date(`${date}T${timeSlot.split("-")[0]}:00`),
      status: "pending"
    });

    vendor.bookedSlots.push({ date, time: timeSlot });
    await vendor.save();

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}