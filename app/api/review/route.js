// app/api/review/route.js
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

    const { vendorId, rating, comment } = await request.json();

    if (!vendorId || !rating || !comment) {
      return NextResponse.json({ error: "All fields required" }, { status: 422 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== "vendor") {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Add the review
    vendor.reviews.push({
      userId: auth.userId,
      rating,
      comment,
      createdAt: new Date()
    });

    await vendor.save();

    return NextResponse.json({ 
      message: "Review added successfully",
      review: {
        userId: auth.userId,
        rating,
        comment,
        createdAt: new Date()
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}