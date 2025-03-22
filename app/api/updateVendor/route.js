// app/api/updateVendor/route.js
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

    const { isAvailable, pricing, availability, servicesOffered } = await request.json();

    const vendor = await User.findById(auth.userId);
    if (!vendor || vendor.role !== "vendor") {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Update only provided fields
    if (typeof isAvailable === 'boolean') vendor.isAvailable = isAvailable;
    if (pricing) vendor.pricing = pricing;
    if (availability) vendor.availability = availability;
    if (servicesOffered) vendor.servicesOffered = servicesOffered;

    vendor.updatedAt = new Date();
    await vendor.save();

    return NextResponse.json({ 
      message: "Vendor updated successfully",
      vendor: {
        id: vendor._id,
        name: vendor.name,
        isAvailable: vendor.isAvailable,
        pricing: vendor.pricing,
        availability: vendor.availability,
        servicesOffered: vendor.servicesOffered
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}