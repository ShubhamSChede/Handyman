import { NextResponse } from "next/server";
import { connect } from "../../../config/dbConfig";
import User from "../../../models/user.model";
import { authenticateUser } from "../../../middleware/authMiddleware";

export async function POST(request) {
  try {
    await connect();
    const auth = await authenticateUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { 
      latitude, 
      longitude, 
      address, 
      landmark, 
      role,
      servicesOffered,
      pricing,
      availability
    } = await request.json();

    // Basic validation
    if (!latitude || !longitude || !address) {
      return NextResponse.json(
        { error: "Latitude, longitude, and address are required" },
        { status: 422 }
      );
    }

    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update basic user fields
    user.address = address;
    user.landmark = landmark || user.landmark;
    user.location = {
      type: "Point",
      coordinates: [longitude, latitude]
    };

    // Handle role update and vendor-specific fields
    if (role === "vendor") {
      user.role = "vendor";
      // Update vendor fields if provided
      if (servicesOffered) {
        user.servicesOffered = servicesOffered;
      }
      if (pricing) {
        user.pricing = pricing;
      }
      if (availability) {
        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(availability.startTime) || !timeRegex.test(availability.endTime)) {
          return NextResponse.json(
            { error: "Invalid time format. Use HH:mm format (24-hour)" },
            { status: 400 }
          );
        }
        user.availability = availability;
      }
    }

    user.updatedAt = new Date();
    const savedUser = await user.save();

    // Remove sensitive information from response
    const userResponse = {
      id: savedUser._id,
      name: savedUser.name,
      phoneNumber: savedUser.phoneNumber,
      address: savedUser.address,
      landmark: savedUser.landmark,
      role: savedUser.role,
      location: savedUser.location
    };

    // Add vendor-specific fields to response if applicable
    if (savedUser.role === "vendor") {
      userResponse.servicesOffered = savedUser.servicesOffered;
      userResponse.pricing = savedUser.pricing;
      userResponse.availability = savedUser.availability;
      userResponse.isAvailable = savedUser.isAvailable;
    }

    return NextResponse.json(
      { 
        message: "User updated successfully",
        user: userResponse
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}