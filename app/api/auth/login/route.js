// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { connect } from "../../../../config/dbConfig";
import User from "../../../../models/user.model";

export async function POST(request) {
    try {
      await connect();
      const { phoneNumber } = await request.json();
  
      if (!phoneNumber) {
        return NextResponse.json(
          { error: "Phone number is required" },
          { status: 400 }
        );
      }
  
      // Find user by phone number
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
  
      return NextResponse.json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          role: user.role,
          address: user.address, // Include address
          landmark: user.landmark, // Include landmark
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }