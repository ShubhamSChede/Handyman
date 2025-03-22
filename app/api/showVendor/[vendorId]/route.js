// app/api/showVendor/[vendorId]/route.js
import { NextResponse } from "next/server";
import { connect } from "../../../../config/dbConfig";
import User from "../../../../models/user.model";

export async function GET(req, { params }) {
  try {
    await connect();
    const { vendorId } = params;
    
    if (!vendorId) {
      return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== "vendor" || !vendor.isAvailable) {
      return NextResponse.json({ error: "Vendor not found or unavailable" }, { status: 404 });
    }

    // Remove sensitive information
    const vendorData = {
      id: vendor._id,
      name: vendor.name,
      servicesOffered: vendor.servicesOffered,
      pricing: vendor.pricing,
      availability: vendor.availability,
      location: vendor.location,
      reviews: vendor.reviews,
      isAvailable: vendor.isAvailable
    };

    return NextResponse.json({ vendor: vendorData }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}