import { NextResponse } from "next/server";
import { connect } from "../../../config/dbConfig";
import User from "../../../models/user.model";
import { authenticateUser } from "../../../middleware/authMiddleware";

export async function PATCH(request) {
  try {
    await connect();
    const auth = await authenticateUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const vendorId = auth.userId;
    
    // Find the vendor
    const vendor = await User.findById(vendorId);
    
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    
    if (vendor.role !== "vendor") {
      return NextResponse.json({ error: "Only vendors can update vendor information" }, { status: 403 });
    }
    
    // Get the data to update
    const { isAvailable, pricing, availability, servicesOffered } = await request.json();
    
    // Update fields if provided
    if (isAvailable !== undefined) {
      vendor.isAvailable = isAvailable;
    }
    
    if (pricing !== undefined) {
      vendor.pricing = pricing;
    }
    
    if (availability) {
      vendor.availability = {
        startTime: availability.startTime || vendor.availability?.startTime || "09:00",
        endTime: availability.endTime || vendor.availability?.endTime || "18:00"
      };
    }
    
    if (servicesOffered) {
      vendor.servicesOffered = servicesOffered;
    }
    
    // Save the updated vendor
    await vendor.save();
    
    // Return updated user without sensitive information
    const userResponse = {
      _id: vendor._id,
      name: vendor.name,
      phoneNumber: vendor.phoneNumber,
      role: vendor.role,
      isAvailable: vendor.isAvailable,
      servicesOffered: vendor.servicesOffered,
      pricing: vendor.pricing,
      availability: vendor.availability,
      location: vendor.location,
      address: vendor.address,
      landmark: vendor.landmark,
      reviews: vendor.reviews,
      bookedSlots: vendor.bookedSlots
    };
    
    return NextResponse.json({ 
      message: "Vendor profile updated successfully",
      user: userResponse
    });

  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ 
      error: "Failed to update vendor information",
      details: error.message 
    }, { status: 500 });
  }
}